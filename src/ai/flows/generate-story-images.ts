'use server';

/**
 * @fileOverview Generates a set of images to be used as a story prompt.
 *
 * - generateStoryImages - Creates three distinct images for storytelling.
 * - GenerateStoryImagesOutput - The return type for the flow.
 */

import { createAIInstance } from '@/ai/genkit';
import { z } from 'zod';

const GenerateStoryImagesOutputSchema = z.object({
  images: z.array(z.string().url()).length(3).describe('An array of three image URLs.'),
  tokensUsed: z.number().optional(),
});
export type GenerateStoryImagesOutput = z.infer<typeof GenerateStoryImagesOutputSchema>;

export async function generateStoryImages(apiKey?: string): Promise<GenerateStoryImagesOutput> {
  return generateStoryImagesFlow(apiKey);
}

async function generateStoryImagesFlow(apiKey?: string): Promise<GenerateStoryImagesOutput> {
  if (!apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(apiKey);
  
  const prompts = [
      "A mysterious, ancient key held in a gloved hand.",
      "A bustling, futuristic city street at night with flying vehicles.",
      "A serene, hidden waterfall in a lush, green forest."
  ];

  const imagePromises = prompts.map(prompt => 
      ai.generate({
          model: 'googleai/gemini-2.5-flash',
          prompt: `cinematic, high detail, photorealistic image: ${prompt}`,
          config: {
              responseModalities: ['TEXT', 'IMAGE'],
          },
      })
  );
  
  const results = await Promise.all(imagePromises);
  const imageUrls = results.map(result => {
      if (!result.media) {
          throw new Error('Image generation failed for one of the prompts.');
      }
      return result.media.url;
  });

  return { 
    images: imageUrls,
    tokensUsed: 0,
  };
}

