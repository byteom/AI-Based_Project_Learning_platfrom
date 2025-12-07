'use server';

/**
 * @fileOverview A flow to generate compound code - multiple files/components together for a complete feature or module.
 *
 * - generateCompoundCode - A function that generates multiple related code files/components together.
 * - GenerateCompoundCodeInput - The input type for the function.
 * - GenerateCompoundCodeOutput - The return type for the function.
 */

import { ai, createAIWithKey } from '@/ai/genkit';
import { z } from 'zod';
import { genkit } from 'genkit';

const GenerateCompoundCodeInputSchema = z.object({
  description: z.string().describe('A detailed description of what code needs to be generated (e.g., "Create a user authentication system with login, register, and logout components").'),
  technology: z.string().describe('The technology stack or framework (e.g., "React with TypeScript", "Node.js with Express", "Python Flask").'),
  files: z.array(z.object({
    name: z.string().describe('The file name (e.g., "Login.tsx", "auth.js", "UserService.ts").'),
    type: z.string().describe('The file type or purpose (e.g., "component", "service", "utility", "config").'),
    description: z.string().describe('What this specific file should contain.'),
  })).describe('An array of files to generate with their names, types, and descriptions.'),
  dependencies: z.array(z.string()).optional().describe('List of dependencies or libraries that should be used.'),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type GenerateCompoundCodeInput = z.infer<typeof GenerateCompoundCodeInputSchema>;

const CodeFileSchema = z.object({
  fileName: z.string().describe('The name of the file.'),
  filePath: z.string().describe('The relative path where this file should be placed (e.g., "src/components/auth/Login.tsx").'),
  content: z.string().describe('The complete code content for this file. All code must be properly formatted.'),
  language: z.string().describe('The programming language (e.g., "typescript", "javascript", "python").'),
  description: z.string().describe('A brief description of what this file does.'),
});

const GenerateCompoundCodeOutputSchema = z.object({
  files: z.array(CodeFileSchema).describe('An array of generated code files.'),
  setupInstructions: z.string().describe('Instructions for setting up and integrating these files.'),
  dependencies: z.array(z.string()).describe('List of dependencies that need to be installed.'),
  tokensUsed: z.number().optional().describe('The number of tokens used to generate the code.'),
});
export type GenerateCompoundCodeOutput = z.infer<typeof GenerateCompoundCodeOutputSchema>;

const COMPOUND_CODE_PROMPT = `You are an expert software architect and developer. Your task is to generate multiple related code files/components that work together to implement a complete feature or module.

**Project Description:**
{{{description}}}

**Technology Stack:**
{{{technology}}}

**Files to Generate:**
{{#each files}}
- **File Name:** {{name}}
- **Type:** {{type}}
- **Description:** {{description}}
{{/each}}

{{#if dependencies}}
**Dependencies to Use:**
{{#each dependencies}}
- {{this}}
{{/each}}
{{/if}}

**Instructions:**
1. Generate complete, production-ready code for each file specified.
2. Ensure all files work together seamlessly - they should import/export from each other correctly.
3. Include proper error handling, type definitions (if using TypeScript), and best practices.
4. Add comments where necessary to explain complex logic.
5. Make sure imports and exports are correct and all dependencies are properly used.
6. Each file should be self-contained but integrate well with others.
7. Include proper file structure and paths.
8. Provide setup instructions for integrating these files.
9. List all dependencies that need to be installed.

**Output Format:**
- For each file, provide: fileName, filePath, content (complete code), language, and description.
- Provide clear setup instructions.
- List all required dependencies.

**CRITICAL:** Generate complete, working code. Do not leave placeholders or TODOs unless absolutely necessary.`;

function createGenerateCompoundCodeFlow(aiInstance: ReturnType<typeof genkit>) {
  const prompt = aiInstance.definePrompt({
    name: 'generateCompoundCodePrompt',
    input: { schema: GenerateCompoundCodeInputSchema },
    output: { schema: GenerateCompoundCodeOutputSchema },
    prompt: COMPOUND_CODE_PROMPT,
  });

  return aiInstance.defineFlow(
    {
      name: 'generateCompoundCodeFlow',
      inputSchema: GenerateCompoundCodeInputSchema,
      outputSchema: GenerateCompoundCodeOutputSchema,
    },
    async (input) => {
      const result = await prompt(input);
      const usage = result.usage;
      const tokensUsed = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);

      return {
        ...result.output!,
        tokensUsed: tokensUsed,
      };
    }
  );
}

const defaultFlow = createGenerateCompoundCodeFlow(ai);

export async function generateCompoundCode(
  input: GenerateCompoundCodeInput
): Promise<GenerateCompoundCodeOutput> {
  // Use custom API key if provided, otherwise use default
  if (input.apiKey) {
    const aiInstance = createAIWithKey(input.apiKey);
    const customFlow = createGenerateCompoundCodeFlow(aiInstance);
    return customFlow(input);
  }
  return defaultFlow(input);
}

