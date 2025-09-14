import { v4 as uuidv4 } from 'uuid';

// Generate unique IDs
export const generateId = (): string => {
  return uuidv4();
};

// Get current timestamp
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

// Format progress percentage for display
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};

// Validate progress value
export const validateProgress = (progress: number): number => {
  return Math.max(0, Math.min(100, progress));
};

// Get progress bar color based on progress value
export const getProgressBarColor = (progress: number): string => {
  if (progress >= 100) return 'bg-success-500';
  if (progress >= 75) return 'bg-warm-500';
  if (progress >= 50) return 'bg-warning-500';
  if (progress >= 25) return 'bg-warning-400';
  return 'bg-gray-300';
};
