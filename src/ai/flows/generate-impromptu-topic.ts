'use server';
/**
 * @fileOverview Generates a topic for an impromptu speech.
 *
 * - generateImpromptuTopic - Creates a random topic for a user to speak about.
 * - GenerateImpromptuTopicOutput - The return type for the flow.
 */

import { createAIInstance } from '@/ai/genkit';
import { z } from 'zod';

const GenerateImpromptuTopicInputSchema = z.object({
    history: z.array(z.string()).optional().describe('A list of previously generated topics to avoid repeating.'),
    apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type GenerateImpromptuTopicInput = z.infer<typeof GenerateImpromptuTopicInputSchema>;


const GenerateImpromptuTopicOutputSchema = z.object({
  topic: z.string().describe('A random, engaging topic for an impromptu speech.'),
  tokensUsed: z.number().optional(),
});

export type GenerateImpromptuTopicOutput = z.infer<typeof GenerateImpromptuTopicOutputSchema>;

export async function generateImpromptuTopic(input?: GenerateImpromptuTopicInput): Promise<GenerateImpromptuTopicOutput> {
  return generateImpromptuTopicFlow(input || {});
}

async function generateImpromptuTopicFlow(input: GenerateImpromptuTopicInput): Promise<GenerateImpromptuTopicOutput> {
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(input.apiKey);
  
  const prompt = ai.definePrompt({
    name: 'generateImpromptuTopicPrompt',
    input: { schema: GenerateImpromptuTopicInputSchema },
    output: { schema: GenerateImpromptuTopicOutputSchema },
    prompt: `You are an AI for a public speaking practice app. 
    Generate a single, interesting, and SFW (safe for work) topic for an impromptu speech. 
    The topic should be a question or a statement that someone can talk about for a minute.
    
    Examples:
    - "What is a skill you'd like to learn and why?"
    - "Describe your favorite place in the world."
    - "If you could have any superpower, what would it be and how would you use it?"
    - "Talk about a book or movie that has had a big impact on you."

    {{#if history}}
    Please generate a new topic that is different from these previous ones:
    {{#each history}}
    - {{{this}}}
    {{/each}}
    {{/if}}
  `,
  });

  const { output } = await prompt(input);
  return {
    ...output!,
    tokensUsed: 0,
  };
}

