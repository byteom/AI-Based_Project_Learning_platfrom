


export interface SubTask {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    content?: string; // Content is now optional and will be loaded on demand.
}

export interface TutorialStep {
  id:string;
  title: string;
  description: string;
  subTasks: SubTask[];
  completed: boolean;
}

export interface Project {
  id: string;
  title:string;
  description: string;
  image: string;
  dataAiHint?: string;
  steps: TutorialStep[];
  tags?: string[];
  skills?: string[];
  simulationDiagram?: string;
}

export interface LearningLesson {
  id: string;
  title: string;
  description: string;
  content?: string; // Content is now optional and will be loaded on demand
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  lessons: LearningLesson[];
}

export interface LearningPath {
  id: string;
  title: string;
  introduction: string;
  modules: LearningModule[];
  difficulty: string;
  topic: string;
}

export interface Subscription {
    userId: string;
    status: 'free' | 'pro' | 'trial';
    plan: string;
    subscriptionId?: string; // e.g., from a payment provider
    trial_start?: number; // timestamp when trial started
    trial_end?: number; // timestamp when trial ends
    current_period_end?: number; // timestamp
}

export interface PricingConfig {
  id: string;
  planName: string;
  price: number;
  currency: string; // 'USD', 'INR', etc.
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  createdAt?: number;
  updatedAt?: number;
}

import type { GenerateInterviewFeedbackOutput } from "@/ai/flows/generate-interview-feedback";

export interface InterviewAnswer {
  id: string;
  userId: string;
  questionId: string;
  question: string;
  answer: string;
  feedback: GenerateInterviewFeedbackOutput;
  createdAt: number; // Timestamp
  transcript?: string;
}

export type InterviewQuestion = {
    id: string;
    question: string;
    category: 'Behavioral' | 'Technical';
    type: 'General' | 'Backend' | 'Frontend' | 'Full Stack' | 'DevOps';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    company?: string;
    tags?: string[];
};

export interface UserProfile {
  uid: string;
  email: string | null;
  roles: ('user' | 'admin')[];
  status?: 'active' | 'blocked';
  createdAt?: number;
}

import type { AnalyzeAccentOutput } from "@/ai/flows/analyze-accent";
import type { AnalyzeToneOutput } from "@/ai/flows/analyze-tone";
import type { AnalyzeStoryOutput } from "@/ai/flows/analyze-story";
import type { Language, Accent, Difficulty, Emotion } from "./accent-ace-config";
import type { Timestamp } from 'firebase/firestore';

export type AccentAceHistoryItem = {
  id: string;
  userId: string;
  phrase: string;
  language: Language;
  accent: Accent;
  difficulty: Difficulty;
  referenceAudioUrl: string;
  recordedAudioUrl?: string;
  analysis?: AnalyzeAccentOutput;
  createdAt: Timestamp | number;
  updatedAt?: Timestamp | number;
};

export type SentenceScrambleHistoryItem = {
  id: string;
  userId: string;
  scrambledSentence: string;
  correctSentence: string;
  scrambledAudioUrl: string;
  recordedAudioUrl?: string;
  analysis?: AnalyzeAccentOutput;
  createdAt: Timestamp | number;
  updatedAt?: Timestamp | number;
}

export type ImpromptuHistoryItem = {
  id: string;
  userId: string;
  topic: string;
  recordedAudioUrl?: string;
  rawTextResponse?: string; // New field for transcribed text
  analysisId?: string; // Link to the analysis history item
  createdAt: Timestamp | number;
};

export type AnalysisHistoryItem = {
  id: string;
  userId: string;
  userResponse: string;
  analysis: string;
  sentiment: string;
  keywords: string[];
  correctedText?: string;
  grammarAccuracy?: number;
  grammarMistakes?: { mistake: string; explanation: string; correction: string }[];
  pronunciation?: {
    overallAccuracy: number;
    detailedFeedback: { word: string; pronunciationAccuracy: number; errorDetails: string }[];
    suggestions: string;
    accentNotes?: string;
  };
  topicalityAdherence?: number;
  topicalityExplanation?: string;
  topicalityStrongPoints?: string[];
  topicalityMissedPoints?: string[];
  delivery?: {
    wordsPerMinute?: number;
    fillerWords?: string[];
    structureFeedback?: string;
    pacingFeedback?: string;
  };
  createdAt: Timestamp | number;
};

export type PitchPerfectHistoryItem = {
  id: string;
  userId: string;
  phrase: string;
  emotion: Emotion;
  recordedAudioUrl?: string;
  analysis?: AnalyzeToneOutput;
  createdAt: Timestamp | number;
  updatedAt?: Timestamp | number;
};

export type StorytellerHistoryItem = {
  id: string;
  userId: string;
  images: string[];
  recordedAudioUrl?: string;
  analysis?: AnalyzeStoryOutput;
  createdAt: Timestamp | number;
  updatedAt?: Timestamp | number;
};
