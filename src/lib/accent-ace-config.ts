export const languages = {
  "English": ["American", "British", "Indian", "Australian"],
  "Spanish": ["Spain", "Mexican"],
  "French": ["France", "Canadian"],
  "German": ["Germany"],
};

export type Language = keyof typeof languages;
export type Accent = (typeof languages)[Language][number];

export const difficulties = ["Easy", "Medium", "Hard"] as const;
export type Difficulty = (typeof difficulties)[number];

export const emotions = ["Happy", "Sad", "Angry", "Excited", "Formal", "Calm"] as const;
export type Emotion = (typeof emotions)[number];

