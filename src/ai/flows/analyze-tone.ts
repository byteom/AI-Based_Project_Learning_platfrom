'use server';

/**
 * @fileOverview Analyzes the emotional tone of a user's speech.
 *
 * - analyzeTone - A function that initiates the tone analysis process.
 * - AnalyzeToneInput - The input type for the analyzeTone function.
 * - AnalyzeToneOutput - The return type for the analyzeTone function.
 */

import { createAIInstance } from '@/ai/genkit';
import {z} from 'zod';
import type { Emotion } from '@/lib/accent-ace-config';

const AnalyzeToneInputSchema = z.object({
  recordedAudioDataUri: z
    .string()
    .describe(
      "The user's recorded audio as a data URI."
    ),
  phrase: z.string().describe("The phrase the user was asked to say."),
  emotion: z.custom<Emotion>().describe("The target emotion the user was trying to convey."),
  apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type AnalyzeToneInput = z.infer<typeof AnalyzeToneInputSchema>;

const AnalyzeToneOutputSchema = z.object({
  consistencyScore: z.number().min(0).max(100).describe("A score (0-100) indicating how well the user's tone matched the target emotion."),
  pitchAnalysis: z.string().describe("Feedback on the user's pitch and intonation."),
  volumeAnalysis: z.string().describe("Feedback on the user's volume and dynamics."),
  overallFeedback: z.string().describe("Holistic feedback and suggestions for improvement."),
  tokensUsed: z.number().optional(),
});
export type AnalyzeToneOutput = z.infer<typeof AnalyzeToneOutputSchema>;

export async function analyzeTone(input: AnalyzeToneInput): Promise<AnalyzeToneOutput> {
  return analyzeToneFlow(input);
}

async function analyzeToneFlow(input: AnalyzeToneInput): Promise<AnalyzeToneOutput> {
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(input.apiKey);
  
  const analyzeTonePrompt = ai.definePrompt({
    name: 'analyzeTonePrompt',
    input: {schema: AnalyzeToneInputSchema},
    output: {schema: AnalyzeToneOutputSchema},
    prompt: `You are an expert speech coach AI. You are analyzing a user's speech to see how well they conveyed a specific emotion.

  The user was asked to say the phrase: "{{phrase}}"
  They were trying to sound: {{emotion}}

  Analyze the provided audio recording. Evaluate the user's pitch, tone, volume, and pacing to determine how successfully they conveyed the target emotion.

  User's recording: {{media url=recordedAudioDataUri}}
  
  Provide the following analysis:
  - consistencyScore: A score from 0 to 100 representing how well the vocal delivery matched the "{{emotion}}" emotion.
  - pitchAnalysis: Specific feedback on the user's pitch. Was it varied or monotone? Was the intonation appropriate for the emotion?
  - volumeAnalysis: Specific feedback on the user's volume. Was it too loud, too soft, or just right? Was there dynamic variation?
  - overallFeedback: Constructive, actionable advice on how the user could better convey the "{{emotion}}" emotion in their speech.
  `,
  });

  const {output} = await analyzeTonePrompt(input);
  return {
    ...output!,
    tokensUsed: 0,
  };
}

