'use server';

/**
 * @fileOverview A text-to-speech generation AI agent.
 *
 * - generateAudio - A function that handles the audio generation process.
 * - GenerateAudioInput - The input type for the generateAudio function.
 * - GenerateAudioOutput - The return type for the generateAudio function.
 */

import { ai, createAIWithKey, createAIInstance } from '@/ai/genkit';
import { z, genkit } from 'genkit';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';

const GenerateAudioInputSchema = z.object({
  text: z.string().describe('The text to convert to audio.'),
  language: z.string().describe('The language of the text.'),
  accent: z.string().describe('The accent for the generated audio.'),
  apiKey: z.string().optional().describe('Optional Gemini API key from frontend'),
});
export type GenerateAudioInput = z.infer<typeof GenerateAudioInputSchema>;

const GenerateAudioOutputSchema = z.object({
  audioDataUri: z
    .string()
    .describe('The generated audio as a data URI in WAV format.'),
});
export type GenerateAudioOutput = z.infer<typeof GenerateAudioOutputSchema>;

export async function generateAudio(
  input: GenerateAudioInput
): Promise<GenerateAudioOutput> {
  // API key is required from user (via sidebar)
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const aiInstance = createAIWithKey(input.apiKey);
  const customFlow = createGenerateAudioFlow(aiInstance);
  return customFlow(input);
}

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

function createGenerateAudioFlow(aiInstance: ReturnType<typeof genkit>) {
  return aiInstance.defineFlow(
    {
      name: 'generateAudioFlow',
      inputSchema: GenerateAudioInputSchema,
      outputSchema: GenerateAudioOutputSchema,
    },
    async ({ text, language, accent }) => {
      const prompt = `You are a voice actor. Read the following text in ${language} with a ${accent} accent: ${text}`;

      const { media } = await aiInstance.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: prompt,
      });
      if (!media) {
        throw new Error('no media returned');
      }
      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );
      const wavBase64 = await toWav(audioBuffer);
      return {
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };
    }
  );
}

const defaultFlow = createGenerateAudioFlow(ai);

