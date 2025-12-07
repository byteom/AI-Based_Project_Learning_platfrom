'use server';
/**
 * @fileOverview Generates a phrase suitable for practicing emotional tone.
 *
 * - generateEmotionPhrase - Creates a phrase for a given emotion.
 * - GenerateEmotionPhraseInput - The input type for the flow.
 * - GenerateEmotionPhraseOutput - The return type for the flow.
 */

import { createAIInstance } from '@/ai/genkit';
import { z } from 'zod';
import type { Emotion } from '@/lib/accent-ace-config';

const GenerateEmotionPhraseInputSchema = z.object({
  emotion: z.custom<Emotion>().describe('The target emotion for the phrase.'),
  history: z.array(z.string()).optional().describe('A list of previously generated phrases to avoid repeating.'),
  apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type GenerateEmotionPhraseInput = z.infer<typeof GenerateEmotionPhraseInputSchema>;

const GenerateEmotionPhraseOutputSchema = z.object({
  phrase: z.string().describe('A sentence that is commonly said with the specified emotion.'),
  tokensUsed: z.number().optional(),
});
export type GenerateEmotionPhraseOutput = z.infer<typeof GenerateEmotionPhraseOutputSchema>;

export async function generateEmotionPhrase(input: GenerateEmotionPhraseInput): Promise<GenerateEmotionPhraseOutput> {
  return generateEmotionPhraseFlow(input);
}

async function generateEmotionPhraseFlow(input: GenerateEmotionPhraseInput): Promise<GenerateEmotionPhraseOutput> {
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(input.apiKey);
  
  const prompt = ai.definePrompt({
    name: 'generateEmotionPhrasePrompt',
    input: { schema: GenerateEmotionPhraseInputSchema },
    output: { schema: GenerateEmotionPhraseOutputSchema },
    prompt: `You are an AI for a speech coaching app. 
    Generate a single, common, SFW (safe for work) English sentence that someone would realistically say with a "{{emotion}}" tone.
    The sentence should be between 7 and 15 words long.
    
    {{#if history}}
    Please generate a new sentence that is different from these previous ones:
    {{#each history}}
    - {{{this}}}
    {{/each}}
    {{/if}}

    Return just the sentence itself.
  `,
  });

  const { output } = await prompt(input);
  return {
    ...output!,
    tokensUsed: 0,
  };
}

