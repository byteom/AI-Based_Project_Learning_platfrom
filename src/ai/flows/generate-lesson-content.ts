
'use server';

/**
 * @fileOverview A flow to generate the detailed content for a single lesson in a learning path.
 *
 * - generateLessonContent - A function that handles content generation for a specific lesson.
 * - GenerateLessonContentInput - The input type for the function.
 * - GenerateLessonContentOutput - The return type for the function.
 */

import { ai, createAIWithKey } from '@/ai/genkit';
import { z } from 'zod';
import { genkit } from 'genkit';

const GenerateLessonContentInputSchema = z.object({
  pathTitle: z.string().describe('The main title of the overall learning path.'),
  moduleTitle: z.string().describe('The title of the current module.'),
  lessonTitle: z.string().describe('The title of the specific lesson to generate content for.'),
  fullOutline: z.string().describe('The full outline of the entire learning path for context.'),
  operatingSystem: z.string().optional().describe("The user's operating system (e.g., 'Windows', 'macOS', 'Linux')."),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type GenerateLessonContentInput = z.infer<typeof GenerateLessonContentInputSchema>;

const GenerateLessonContentOutputSchema = z.object({
  content: z.string().describe('The detailed, well-structured Markdown content for the lesson. All code snippets must be in fenced code blocks with language identifiers.'),
  tokensUsed: z.number().optional().describe('The number of tokens used to generate the content.'),
});
export type GenerateLessonContentOutput = z.infer<typeof GenerateLessonContentOutputSchema>;


const LESSON_CONTENT_PROMPT = `You are an expert technical writer creating content for a learning path.
Your task is to generate the detailed content for a single lesson within a larger curriculum.

**Learning Path Context:**
- **Path Title:** {{{pathTitle}}}
- **Full Path Outline:**
{{{fullOutline}}}

**Current Lesson:**
- **Module:** {{{moduleTitle}}}
- **Lesson:** {{{lessonTitle}}}
{{#if operatingSystem}}
**Target Operating System:** {{{operatingSystem}}}
**Instruction**: Your response should be tailored to the user's OS. For example, use appropriate command-line instructions (e.g., 'dir' for Windows, 'ls' for Linux/macOS) and file path separators.
{{/if}}

**Instructions:**
1.  Generate comprehensive, easy-to-follow content for the specified lesson.
2.  Provide clear explanations of the concepts involved.
3.  Include all necessary code snippets for this lesson.
4.  **CRITICAL:** All code snippets must be enclosed in fenced code blocks with the appropriate language identifier (e.g., \`\`\`javascript or \`\`\`bash).
5.  Format the response using Markdown for headings, lists, and inline code.
6.  Focus ONLY on the current lesson. Do not include content from other lessons.
`;

function createGenerateLessonContentFlow(aiInstance: ReturnType<typeof genkit>) {
  const prompt = aiInstance.definePrompt({
    name: 'generateLessonContentPrompt',
    input: { schema: GenerateLessonContentInputSchema },
    output: { schema: GenerateLessonContentOutputSchema },
    prompt: LESSON_CONTENT_PROMPT,
  });

  return aiInstance.defineFlow(
    {
      name: 'generateLessonContentFlow',
      inputSchema: GenerateLessonContentInputSchema,
      outputSchema: GenerateLessonContentOutputSchema,
    },
    async (input) => {
      const result = await prompt(input);
      const usage = result.usage;
      const tokensUsed = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);

      return {
        content: result.output!.content,
        tokensUsed: tokensUsed,
      };
    }
  );
}

const defaultFlow = createGenerateLessonContentFlow(ai);

export async function generateLessonContent(
  input: GenerateLessonContentInput
): Promise<GenerateLessonContentOutput> {
  // Use custom API key if provided, otherwise use default
  if (input.apiKey) {
    const aiInstance = createAIWithKey(input.apiKey);
    const customFlow = createGenerateLessonContentFlow(aiInstance);
    return customFlow(input);
  }
  return defaultFlow(input);
}
