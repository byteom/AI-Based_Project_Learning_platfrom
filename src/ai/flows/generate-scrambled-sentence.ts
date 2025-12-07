'use server';
/**
 * @fileOverview Generates a scrambled (jumbled) sentence for a game.
 *
 * - generateScrambledSentence - Creates a jumbled sentence and returns it along with the original.
 * - GenerateScrambledSentenceOutput - The return type for the flow.
 */

import { createAIInstance } from '@/ai/genkit';
import { z } from 'zod';

const GenerateScrambledSentenceInputSchema = z.object({
  history: z.array(z.string()).optional().describe('A list of previously generated sentences to avoid repeating.'),
  apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type GenerateScrambledSentenceInput = z.infer<typeof GenerateScrambledSentenceInputSchema>;

const GenerateScrambledSentenceOutputSchema = z.object({
  original: z.string().describe('The original, correct sentence.'),
  jumbled: z.string().describe('The jumbled version of the sentence.'),
  tokensUsed: z.number().optional(),
});
export type GenerateScrambledSentenceOutput = z.infer<typeof GenerateScrambledSentenceOutputSchema>;

export async function generateScrambledSentence(input?: GenerateScrambledSentenceInput): Promise<GenerateScrambledSentenceOutput> {
  return generateScrambledSentenceFlow(input || {});
}

async function generateScrambledSentenceFlow(input: GenerateScrambledSentenceInput): Promise<GenerateScrambledSentenceOutput> {
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(input.apiKey);
  
  const prompt = ai.definePrompt({
    name: 'generateScrambledSentencePrompt',
    input: { schema: GenerateScrambledSentenceInputSchema },
    output: { schema: GenerateScrambledSentenceOutputSchema },
    prompt: `You are an AI for a language learning game.
    Generate a common English sentence that is between 7 and 12 words long.
    Then, jumble the words of that sentence.

    {{#if history}}
    Please generate a new sentence that is different from these previous ones:
    {{#each history}}
    - {{{this}}}
    {{/each}}
    {{/if}}
    
    Return both the original sentence and the jumbled sentence.
    For example:
    Original: "The quick brown fox jumps over the lazy dog."
    Jumbled: "lazy the over fox brown jumps dog The quick."
    `,
  });

  const { output } = await prompt(input);
  return {
    ...output!,
    tokensUsed: 0, // Genkit doesn't expose token usage directly
  };
}

