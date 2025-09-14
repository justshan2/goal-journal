import { Goal, ProgressUpdate, AppState, STORAGE_KEYS } from '@/types';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Generic storage functions
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

export const saveToStorage = <T>(key: string, value: T): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
};

// Goal-specific storage functions
export const getGoals = (): Goal[] => {
  return getFromStorage(STORAGE_KEYS.GOALS, []);
};

export const saveGoals = (goals: Goal[]): void => {
  saveToStorage(STORAGE_KEYS.GOALS, goals);
};

// Progress update storage functions
export const getUpdates = (): ProgressUpdate[] => {
  return getFromStorage(STORAGE_KEYS.UPDATES, []);
};

export const saveUpdates = (updates: ProgressUpdate[]): void => {
  saveToStorage(STORAGE_KEYS.UPDATES, updates);
};

// Combined app state functions
export const getAppState = (): AppState => {
  return {
    goals: getGoals(),
    updates: getUpdates(),
  };
};

export const saveAppState = (state: AppState): void => {
  saveGoals(state.goals);
  saveUpdates(state.updates);
};

// Clear all data (useful for testing)
export const clearAllData = (): void => {
  if (!isBrowser) return;
  
  localStorage.removeItem(STORAGE_KEYS.GOALS);
  localStorage.removeItem(STORAGE_KEYS.UPDATES);
};

// Reset goals to empty array (useful for testing)
export const resetGoals = (): void => {
  if (!isBrowser) return;
  
  saveGoals([]);
  saveUpdates([]);
};
