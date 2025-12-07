import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Get API key from environment
function getDefaultApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || undefined;
}

// Default AI instance - only create if API key exists
const defaultApiKey = getDefaultApiKey();
export const ai = defaultApiKey 
  ? genkit({
      plugins: [
        googleAI({
          apiKey: defaultApiKey,
        }),
      ],
      model: 'googleai/gemini-2.5-flash',
    })
  : (() => {
      // Create a dummy instance that will throw when used
      const dummy = genkit({
        plugins: [
          googleAI({
            apiKey: '', // Empty string will cause error when used
          }),
        ],
        model: 'googleai/gemini-2.5-flash',
      });
      return dummy;
    })();

// Function to create AI instance with custom API key
export function createAIInstance(apiKey?: string) {
  const key = apiKey || getDefaultApiKey();
  if (!key) {
    throw new Error('API key is required. Please provide apiKey parameter or set GEMINI_API_KEY environment variable.');
  }
  return genkit({
    plugins: [
      googleAI({
        apiKey: key,
      }),
    ],
    model: 'googleai/gemini-2.5-flash',
  });
}

// Legacy function name for backward compatibility
export function createAIWithKey(apiKey: string) {
  return createAIInstance(apiKey);
}
