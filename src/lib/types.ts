


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
