
'use server';

/**
 * @fileOverview A tutorial generator AI agent.
 *
 * - generateTutorial - A function that handles the tutorial generation process.
 * - GenerateTutorialInput - The input type for the generateTutorial function.
 * - GenerateTutorialOutput - The return type for the generateTutorial function.
 */

import {ai, createAIWithKey} from '@/ai/genkit';
import {z, genkit} from 'genkit';

const GenerateTutorialInputSchema = z.object({
  prompt: z.string().describe('The prompt to generate a tutorial from.'),
  difficulty: z.string().describe("The desired difficulty for the tutorial (e.g., 'Easy', 'Medium', 'Hard')."),
  operatingSystem: z.string().optional().describe("The user's operating system (e.g., 'Windows', 'macOS', 'Linux')."),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type GenerateTutorialInput = z.infer<typeof GenerateTutorialInputSchema>;

const SubTaskSchema = z.object({
    id: z.string().describe("A unique ID for the sub-task (e.g., 'subtask-1-1')."),
    title: z.string().describe('The title of the sub-task.'),
    description: z.string().describe('A short, one-sentence description of what this sub-task covers.'),
});

const TutorialStepSchema = z.object({
    id: z.string().describe("A unique ID for the step (e.g., 'step-1-setup')."),
    title: z.string().describe('The title of the tutorial step.'),
    description: z.string().describe('A short, one-paragraph description of what this step covers.'),
    subTasks: z.array(SubTaskSchema).describe('A list of specific, actionable sub-tasks for this step.'),
});

const GenerateTutorialOutputSchema = z.object({
  title: z.string().describe('The main title of the overall tutorial.'),
  description: z.string().describe('A short, one-paragraph description of the entire project.'),
  steps: z.array(TutorialStepSchema).describe('An array of tutorial steps.'),
  tags: z.array(z.string()).describe("A list of relevant tags for the project, such as programming language (e.g., 'C++'), frameworks (e.g., 'React'), and difficulty level ('Easy', 'Medium', 'Hard')."),
  skills: z.array(z.string()).describe("A list of specific skills the user will learn (e.g., 'React Hooks', 'API Fetching', 'CSS Grid')."),
  simulationDiagram: z.string().describe("A high-level architecture or flowchart of the project in Mermaid.js graph syntax (e.g., 'graph TD; A-->B;')."),
  progress: z.string().describe('A short summary of the generated tutorial.'),
  tokensUsed: z.number().optional().describe('The number of tokens used to generate the tutorial.'),
});
export type GenerateTutorialOutput = z.infer<typeof GenerateTutorialOutputSchema>;

const TUTORIAL_PROMPT = `You are an expert tutorial generator specializing in creating detailed, comprehensive, project-based learning guides for software developers. Your output must be a robust and well-structured project outline.

**Project Request:** {{{prompt}}}
**Difficulty Level:** {{{difficulty}}}
{{#if operatingSystem}}
**Target Operating System:** {{{operatingSystem}}}
**Instruction**: Your response must be tailored to the user's OS. For example, use appropriate command-line instructions (e.g., 'dir' for Windows, 'ls' for Linux/macOS) and file path separators.
{{/if}}

**Instructions:**
Your task is to generate a complete project outline based on the user's prompt and the specified difficulty level. The goal is to break down a complex project into a large number of small, manageable, and actionable tasks. For a "Hard" project, you should aim for 100-150 total sub-tasks.

1.  **Main Title and Description:** Generate a concise, descriptive main title and a one-paragraph summary for the entire project.
2.  **High-Level Steps:** Decompose the project into a series of logical, high-level steps (e.g., 'Project Setup', 'API Integration', 'UI Implementation', 'Database Design', 'Deployment'). Each step must have a title and a one-paragraph description.
3.  **Granular Sub-Tasks:** This is the most critical part. For each high-level step, create a detailed list of specific, actionable sub-tasks.
    *   The number and complexity of sub-tasks should directly correspond to the requested **difficulty level**.
        *   **Easy:** Fewer steps, basic sub-tasks. Focus on the core concepts.
        *   **Medium:** More steps, more detailed sub-tasks. Introduce more advanced concepts.
        *   **Hard:** A large number of steps and a very high number of sub-tasks (aim for 100-150 total). Cover advanced topics, edge cases, testing, and best practices.
    *   Each sub-task MUST have a unique ID, a descriptive title, and a single, informative sentence describing its purpose. The sub-task titles should be imperative (e.g., 'Create the Main Component', 'Implement the API Call').
4.  **Tags:** Generate a list of relevant tags for the project. Include the primary programming language, any frameworks or major libraries, and the difficulty rating provided.
5.  **Skills:** Generate a list of 5-10 specific, tangible skills the user will learn by completing this project (e.g., "State Management with React Hooks", "Data Fetching with Axios", "Responsive Design with Flexbox").
6.  **Simulation Diagram:** Create a high-level system architecture or flowchart for the project. The diagram MUST be written using Mermaid.js 'graph' syntax (e.g., 'graph TD; A[Client] --> B(API); B --> C{Database};'). This should give a simple, clear overview of the main components and their interactions.

**CRITICAL:** Do NOT generate the actual implementation code or detailed markdown content in this step. You are only creating the tutorial's high-level structure and outline. The output must be exhaustive and detailed.`;

function createGenerateTutorialFlow(aiInstance: ReturnType<typeof genkit>) {
  const prompt = aiInstance.definePrompt({
    name: 'generateTutorialPrompt',
    input: {schema: GenerateTutorialInputSchema},
    output: {schema: GenerateTutorialOutputSchema},
    prompt: TUTORIAL_PROMPT,
  });
  
  return aiInstance.defineFlow(
    {
      name: 'generateTutorialFlow',
      inputSchema: GenerateTutorialInputSchema,
      outputSchema: GenerateTutorialOutputSchema,
    },
    async input => {
      const result = await prompt(input);
      const usage = result.usage;
      const tokensUsed = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);
      return {
        ...result.output!,
        tokensUsed: tokensUsed,
        progress: 'Generated a tutorial from the given prompt.'
      };
    }
  );
}

const defaultFlow = createGenerateTutorialFlow(ai);

export async function generateTutorial(input: GenerateTutorialInput): Promise<GenerateTutorialOutput> {
  // Use custom API key if provided, otherwise use default
  if (input.apiKey) {
    const aiInstance = createAIWithKey(input.apiKey);
    const customFlow = createGenerateTutorialFlow(aiInstance);
    return customFlow(input);
  }
  return defaultFlow(input);
}
