export interface Goal {
  id: string;
  title: string;
  description?: string;
  initialProgress?: string; // User's initial progress description (e.g., "1302 rating in ultra ball 4")
  context?: string; // Additional context about the goal (e.g., "1450 is the next rank")
  overallProgress: number; // 0-100
  status: 'in-progress' | 'paused' | 'completed'; // Goal status
  createdAt: string;
  updatedAt: string;
}

export interface ProgressUpdate {
  id: string;
  goalId: string;
  journalEntry: string;
  timestamp: string;
  llmResponse?: LLMProgressResponse;
}

export interface LLMProgressResponse {
  overall_progress: number;
  progress_increase: number;
  reasoning: string;
  feedback: string;
}

export interface Milestone {
  title: string;
  description: string;
  timeline: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Habit {
  name: string;
  description: string;
  frequency: string;
  impact: string;
}

export interface LLMCoachingResponse {
  milestones: Milestone[];
  habits: Habit[];
  advice: string;
}

export interface AppState {
  goals: Goal[];
  updates: ProgressUpdate[];
}

// LocalStorage key constants
export const STORAGE_KEYS = {
  GOALS: 'goal_tracker_goals',
  UPDATES: 'goal_tracker_updates',
} as const;
