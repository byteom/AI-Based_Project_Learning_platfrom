'use server';

import { createAIInstance } from '@/ai/genkit';
import { z } from 'zod';

const TranscribeAudioInputSchema = z.object({
  recordedAudioDataUri: z
    .string()
    .describe(
      "The user's recorded audio as a data URI (e.g., data:audio/webm;base64,...)"
    ),
  apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcript: z
    .string()
    .describe('The transcribed text of the provided audio.'),
  tokensUsed: z.number().optional(),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(
  input: TranscribeAudioInput,
): Promise<TranscribeAudioOutput> {
  return transcribeAudioFlow(input);
}

async function transcribeAudioFlow(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  const ai = createAIInstance(input.apiKey);
  
  const transcribePrompt = ai.definePrompt({
    name: 'transcribeAudioPrompt',
    input: { schema: TranscribeAudioInputSchema },
    output: { schema: TranscribeAudioOutputSchema },
    prompt: `You are an accurate speech transcription assistant.
Transcribe the following audio precisely, preserving punctuation and capitalization where appropriate.

Audio: {{media url=recordedAudioDataUri}}

Return only the transcript text in the 'transcript' field.
`,
  });

  const { output } = await transcribePrompt(input);
  return {
    ...output!,
    tokensUsed: 0,
  };
}

