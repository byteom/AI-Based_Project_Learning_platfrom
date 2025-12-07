
'use server';

/**
 * @fileOverview A flow to generate feedback on an interview answer, including optional audio analysis.
 *
 * - generateInterviewFeedback - A function that handles the feedback generation.
 * - GenerateInterviewFeedbackInput - The input type for the function.
 * - GenerateInterviewFeedbackOutput - The return type for the function.
 */

import { ai, createAIWithKey } from '@/ai/genkit';
import { z } from 'zod';
import { genkit } from 'genkit';

const GenerateInterviewFeedbackInputSchema = z.object({
  question: z.string().describe("The interview question that was asked."),
  answerText: z.string().optional().describe("The user's typed answer."),
  answerAudio: z.string().optional().describe("The user's answer recorded as an audio data URI."),
  apiKey: z.string().optional().describe('The Gemini API key to use for this request.'),
});
export type GenerateInterviewFeedbackInput = z.infer<typeof GenerateInterviewFeedbackInputSchema>;

const AnalysisCriteriaSchema = z.object({
  rating: z.string().describe("The rating for this criterion (e.g., 'N/A', 'Needs Improvement', 'Average', 'Good', 'Excellent')."),
  reason: z.string().describe("A brief, one-sentence justification for the rating."),
});

const GenerateInterviewFeedbackOutputSchema = z.object({
  feedback: z.string().describe('Detailed, constructive feedback on the user\'s answer, formatted in Markdown. It should analyze the answer\'s structure, clarity, and content, and provide specific suggestions for improvement.'),
  score: z.number().min(0).max(100).describe('A score from 0 to 100 representing the overall quality of the answer, considering both content and delivery (if applicable).'),
  transcript: z.string().describe("The full transcript of the user's answer. If text was provided, this is the text. If audio was provided, this is the audio transcript."),
  analysis: z.object({
    clarity: AnalysisCriteriaSchema.describe("How clear and easy to understand the answer was."),
    relevance: AnalysisCriteriaSchema.describe("How well the answer addressed the question."),
    fillerWords: AnalysisCriteriaSchema.describe("Analysis of the use of filler words like 'um', 'ah', 'like'. A lower frequency is better. 'N/A' if audio not provided."),
    pacing: AnalysisCriteriaSchema.describe("Analysis of the speaking pace. Was it too fast, too slow, or just right? 'N/A' if audio not provided."),
    confidence: AnalysisCriteriaSchema.describe("Analysis of the perceived confidence based on tone and speech patterns. 'N/A' if audio not provided."),
  }).describe('A detailed analysis of the user\'s answer across multiple criteria.'),
  tokensUsed: z.number().optional().describe('The number of tokens used to generate the feedback.'),
});
export type GenerateInterviewFeedbackOutput = z.infer<typeof GenerateInterviewFeedbackOutputSchema>;


const FEEDBACK_PROMPT = `You are a world-class interview and speech coach. Your task is to provide high-quality, constructive feedback on a user's answer to an interview question.
You will receive the interview question and the user's answer, which can be either text or an audio recording.

**Interview Question:**
---
{{{question}}}
---

**Instructions:**
Your response MUST be tailored based on the input type (text or audio).

{{#if answerAudio}}
  **Analysis for Spoken Answer (Audio):**
  ---
  **User's Spoken Answer (Audio):** {{media url=answerAudio}}
  ---
  1.  **Transcribe the Audio:** First, accurately transcribe the user's spoken answer. The full transcript must be included in the 'transcript' output field.
  2.  **Analyze the Content (from Transcript):** Based on your transcription, evaluate the substance of the answer for Clarity and Relevance.
  3.  **Analyze the Delivery (from Audio):** Listen to the audio to evaluate the user's delivery. Analyze Filler Words, Pacing, and Confidence. A great answer has very few filler words, good pacing, and a confident tone.
  4.  **Provide Structured Analysis:** For all five criteria (Clarity, Relevance, FillerWords, Pacing, Confidence), provide a rating and a brief reason.
  5.  **Provide Detailed Feedback & Score:** Write comprehensive feedback in Markdown. Be encouraging and actionable. Give an overall score from 0 to 100, considering BOTH content and delivery.
{{else}}
  **Analysis for Written Answer (Text):**
  ---
  **User's Written Answer:** {{{answerText}}}
  ---
  1.  **Set Transcript:** The 'transcript' output field should be the same as the provided 'answerText'.
  2.  **Analyze the Content:** Evaluate the substance of the written answer for Clarity and Relevance.
  3.  **Handle Delivery Metrics:** For Filler Words, Pacing, and Confidence, you MUST set the rating to 'N/A' and the reason to 'Audio analysis not applicable for text-based answers.'
  4.  **Provide Detailed Feedback & Score:** Write comprehensive feedback in Markdown. Give an overall score from 0 to 100, considering ONLY the content of the answer.
{{/if}}

**General Feedback Rules:**
*   **Be Encouraging:** Always start with a positive point.
*   **Be Actionable:** Provide concrete examples of how the user could improve.
*   **Use Markdown:** Format the feedback for readability.
`;

function createGenerateInterviewFeedbackFlow(aiInstance: ReturnType<typeof genkit>) {
  const prompt = aiInstance.definePrompt({
    name: 'generateInterviewFeedbackPrompt',
    input: { schema: GenerateInterviewFeedbackInputSchema },
    output: { schema: GenerateInterviewFeedbackOutputSchema },
    prompt: FEEDBACK_PROMPT,
  });

  return aiInstance.defineFlow(
    {
      name: 'generateInterviewFeedbackFlow',
      inputSchema: GenerateInterviewFeedbackInputSchema,
      outputSchema: GenerateInterviewFeedbackOutputSchema,
    },
    async (input) => {
      if (!input.answerAudio && !input.answerText) {
        throw new Error('Either an audio answer or a text answer must be provided.');
      }
      const result = await prompt(input);
      const usage = result.usage;
      const tokensUsed = (usage?.inputTokens || 0) + (usage?.outputTokens || 0);
      return {
        ...result.output!,
        tokensUsed: tokensUsed,
      };
    }
  );
}

const defaultFlow = createGenerateInterviewFeedbackFlow(ai);

export async function generateInterviewFeedback(
  input: GenerateInterviewFeedbackInput
): Promise<GenerateInterviewFeedbackOutput> {
  // Use custom API key if provided, otherwise use default
  if (input.apiKey) {
    const aiInstance = createAIWithKey(input.apiKey);
    const customFlow = createGenerateInterviewFeedbackFlow(aiInstance);
    return customFlow(input);
  }
  return defaultFlow(input);
}
