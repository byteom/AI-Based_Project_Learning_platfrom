'use server';

/**
 * @fileOverview Analyzes a user's story based on their audio recording and a set of images.
 *
 * - analyzeStory - A function that initiates the story analysis process.
 * - AnalyzeStoryInput - The input type for the analyzeStory function.
 * - AnalyzeStoryOutput - The return type for the analyzeStory function.
 */

import { createAIInstance } from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeStoryInputSchema = z.object({
  storyAudioDataUri: z
    .string()
    .describe(
      "The user's recorded story as a data URI."
    ),
  imageUrls: z.array(z.string().url()).length(3).describe("An array of three image URLs that were the prompt for the story."),
  apiKey: z.string().optional().describe('Gemini API key for AI instance creation.'),
});
export type AnalyzeStoryInput = z.infer<typeof AnalyzeStoryInputSchema>;

const AnalyzeStoryOutputSchema = z.object({
  relevanceScore: z.number().min(0).max(100).describe("A score (0-100) indicating how well the story connects to the provided images."),
  feedback: z.string().describe("Constructive feedback on how well the story incorporates the themes and elements of the images."),
  titleSuggestion: z.string().describe("A creative title suggestion for the story."),
  tokensUsed: z.number().optional(),
});
export type AnalyzeStoryOutput = z.infer<typeof AnalyzeStoryOutputSchema>;

export async function analyzeStory(input: AnalyzeStoryInput): Promise<AnalyzeStoryOutput> {
  return analyzeStoryFlow(input);
}

async function analyzeStoryFlow(input: AnalyzeStoryInput): Promise<AnalyzeStoryOutput> {
  if (!input.apiKey) {
    throw new Error('API key is required. Please enter your Gemini API key in the sidebar to use this feature.');
  }
  const ai = createAIInstance(input.apiKey);
  
  const analyzeStoryPrompt = ai.definePrompt({
    name: 'analyzeStoryPrompt',
    input: {schema: AnalyzeStoryInputSchema},
    output: {schema: AnalyzeStoryOutputSchema},
    prompt: `You are an expert story critic AI. You are analyzing a user's spoken story to evaluate how well it connects with three prompt images.

  The user was shown these three images:
  Image 1: {{media url=imageUrls[0]}}
  Image 2: {{media url=imageUrls[1]}}
  Image 3: {{media url=imageUrls[2]}}

  Listen to the user's story recording and analyze it based on the images.
  User's story: {{media url=storyAudioDataUri}}
  
  Provide the following analysis:
  - relevanceScore: A score from 0 to 100 representing how well the story creatively and coherently connects all three images.
  - feedback: Constructive feedback on the storytelling. Did it mention elements from each image? Was the narrative compelling? How could they improve?
  - titleSuggestion: A creative and fitting title for the story they told.
  `,
  });

  const {output} = await analyzeStoryPrompt(input);
  return {
    ...output!,
    tokensUsed: 0,
  };
}

