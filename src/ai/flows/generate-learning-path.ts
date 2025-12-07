
'use server';

/**
 * @fileOverview A flow to generate a comprehensive learning path for any given topic.
 *
 * - generateLearningPath - A function that handles the learning path generation.
 * - GenerateLearningPathInput - The input type for the function.
 * - GenerateLearningPathOutput - The return type for the function.
 */

import { ai, createAIWithKey } from '@/ai/genkit';
import { z } from 'zod';
import { genkit } from 'genkit';

const GenerateLearningPathInputSchema = z.object({
  topic: z.string().describe("The topic the user wants to learn (e.g., 'C++', 'Python', 'React Native')."),
  difficulty: z.string().describe("The desired difficulty for the learning path (e.g., 'Easy', 'Medium', 'Hard')."),
  operatingSystem: z.string().optional().describe("The user's operating system (e.g., 'Windows', 'macOS', 'Linux')."),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type GenerateLearningPathInput = z.infer<typeof GenerateLearningPathInputSchema>;

const LearningLessonSchema = z.object({
  id: z.string().describe("A unique ID for the lesson (e.g., 'lesson-1-1')."),
  title: z.string().describe('The title of the lesson.'),
  description: z.string().describe('A short, one-sentence description of what this lesson covers.'),
});

const LearningModuleSchema = z.object({
  id: z.string().describe("A unique ID for the module (e.g., 'module-1-basics')."),
  title: z.string().describe('The title of the learning module.'),
  description: z.string().describe('A short, one-paragraph description of what this module covers.'),
  lessons: z.array(LearningLessonSchema).describe('A list of specific lessons for this module.'),
});

const GenerateLearningPathOutputSchema = z.object({
  id: z.string().describe('A unique ID for the learning path.'),
  title: z.string().describe('The main title of the overall learning path.'),
  introduction: z.string().describe('A short, one-paragraph introduction to the topic.'),
  modules: z.array(LearningModuleSchema).describe('An array of learning modules.'),
  tokensUsed: z.number().optional().describe('The number of tokens used to generate the path.'),
  topic: z.string().describe("The topic the user wants to learn (e.g., 'C++', 'Python', 'React Native')."),
  difficulty: z.string().describe("The desired difficulty for the learning path (e.g., 'Easy', 'Medium', 'Hard')."),
});
export type GenerateLearningPathOutput = z.infer<typeof GenerateLearningPathOutputSchema>;


const LEARNING_PATH_PROMPT = `You are an expert curriculum designer creating a learning path for a given topic.
Your task is to generate a well-structured learning path outline with modules and lessons.
**IMPORTANT**: Do NOT generate the actual lesson content. Only generate the titles and descriptions for the modules and lessons.

**Topic:** {{{topic}}}
**Difficulty Level:** {{{difficulty}}}
{{#if operatingSystem}}
**Target Operating System:** {{{operatingSystem}}}
**Instruction**: Your response should be tailored to the user's OS. For example, use appropriate command-line instructions (e.g., 'dir' for Windows, 'ls' for Linux/macOS).
{{/if}}

**Instructions:**
1.  **ID**: Generate a unique ID for this learning path. It should be a slug-style string based on the topic and difficulty, like 'learn-react-basics-easy'.
2.  **Structure:** Create a series of modules. Each module should represent a major unit of study.
3.  **Lessons:** Within each module, create several lessons. Each lesson must have a title and a short description.
4.  **Difficulty:** The depth and complexity of the modules and lessons should directly correspond to the requested difficulty level.
    *   **Easy:** Focus on fundamental concepts, simple examples, and getting started.
    *   **Medium:** Introduce more intermediate concepts, more complex examples, and best practices.
    *   **Hard:** Cover advanced topics, complex use cases, performance considerations, and in-depth theory.
`;

function createGenerateLearningPathFlow(aiInstance: ReturnType<typeof genkit>) {
  const prompt = aiInstance.definePrompt({
    name: 'generateLearningPathPrompt',
    input: { schema: GenerateLearningPathInputSchema },
    output: { schema: GenerateLearningPathOutputSchema },
    prompt: LEARNING_PATH_PROMPT,
  });

  return aiInstance.defineFlow(
    {
      name: 'generateLearningPathFlow',
      inputSchema: GenerateLearningPathInputSchema,
      outputSchema: GenerateLearningPathOutputSchema,
    },
    async (input) => {
      const result = await prompt(input);
      const usage = result.usage;
      const tokensUsed = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);
      const output = result.output!;
      
      return {
        id: `${output.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${output.difficulty.toLowerCase()}-${Date.now()}`,
        ...output,
        topic: input.topic,
        difficulty: input.difficulty,
        tokensUsed: tokensUsed,
      };
    }
  );
}

const defaultFlow = createGenerateLearningPathFlow(ai);

export async function generateLearningPath(
  input: GenerateLearningPathInput
): Promise<GenerateLearningPathOutput> {
  // Use custom API key if provided, otherwise use default
  if (input.apiKey) {
    const aiInstance = createAIWithKey(input.apiKey);
    const customFlow = createGenerateLearningPathFlow(aiInstance);
    return customFlow(input);
  }
  return defaultFlow(input);
}
