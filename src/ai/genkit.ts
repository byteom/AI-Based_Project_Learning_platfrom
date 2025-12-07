import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Default AI instance (fallback to env variable)
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

// Function to create AI instance with custom API key
export function createAIWithKey(apiKey: string) {
  return genkit({
    plugins: [
      googleAI({
        apiKey: apiKey,
      }),
    ],
    model: 'googleai/gemini-2.5-flash',
  });
}
