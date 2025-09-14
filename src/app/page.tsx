'use client';

import React, { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { Goal, ProgressUpdate, LLMProgressResponse, LLMCoachingResponse } from '@/types';
import { getCurrentTimestamp, generateId, validateProgress } from '@/lib/utils';
import { getAppState, saveAppState } from '@/lib/storage';

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<string>('');
  const [latestProgressIncrease, setLatestProgressIncrease] = useState<number | undefined>();
  const [latestReasoning, setLatestReasoning] = useState<string>('');
  const [coachingResponses, setCoachingResponses] = useState<Record<string, LLMCoachingResponse>>({});

  // Load data from localStorage on component mount
  useEffect(() => {
    const appState = getAppState();
    
    // Migrate existing goals to include status field
    const migratedGoals = appState.goals.map(goal => ({
      ...goal,
      status: goal.status || 'in-progress' as 'in-progress' | 'paused' | 'completed'
    }));
    
    setGoals(migratedGoals);
    setUpdates(appState.updates);
  }, []);

  // Save data to localStorage whenever goals or updates change
  useEffect(() => {
    if (goals.length > 0 || updates.length > 0) {
      saveAppState({ goals, updates });
    }
  }, [goals, updates]);

  const handleGoalsChange = (newGoals: Goal[]) => {
    setGoals(newGoals);
  };

  const handleSubmitUpdate = async (goalId: string, journalEntry: string) => {
    setIsLoading(true);
    
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      setIsLoading(false);
      return;
    }
    
    try {

      // Create the progress update record
      const updateId = generateId();
      const timestamp = getCurrentTimestamp();
      
      const newUpdate: ProgressUpdate = {
        id: updateId,
        goalId,
        journalEntry,
        timestamp,
      };

      // Get previous updates for this goal to provide context
      const previousUpdates = updates.filter(update => update.goalId === goalId);

      // Call the API to get LLM analysis
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          journalEntry,
          previousUpdates,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Process the LLM response
        const llmResponse: LLMProgressResponse = result.data;
        
        // Update the progress update with LLM response
        newUpdate.llmResponse = llmResponse;

        // Update goals based on LLM response
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            const newProgress = validateProgress(llmResponse.overall_progress);
            return {
              ...g,
              overallProgress: newProgress,
              // Auto-complete if progress reaches 100%
              status: newProgress >= 100 ? 'completed' : g.status,
              updatedAt: timestamp,
            };
          }
          return g;
        });

        setGoals(updatedGoals);
        setUpdates(prev => [...prev, newUpdate]);

        // Check if goal was auto-completed
        const wasAutoCompleted = validateProgress(llmResponse.overall_progress) >= 100 && 
                                 goals.find(g => g.id === goalId)?.status !== 'completed';

        // Show success feedback in UI
        let feedbackMessage = llmResponse.feedback;
        if (wasAutoCompleted) {
          feedbackMessage = `🎉 Congratulations! Goal completed! ${llmResponse.feedback}`;
        }
        
        setLatestFeedback(feedbackMessage);
        setLatestProgressIncrease(llmResponse.progress_increase);
        setLatestReasoning(llmResponse.reasoning);
        console.log('Progress updated successfully:', feedbackMessage);
        
      } else {
      // Handle API error - use fallback if available
      if (result.fallback) {
        newUpdate.llmResponse = result.fallback;
        
        // Update goals with fallback response and check for auto-completion
        const updatedGoals = goals.map(g => {
          if (g.id === goalId) {
            const newProgress = validateProgress(result.fallback.overall_progress);
            return {
              ...g,
              overallProgress: newProgress,
              // Auto-complete if progress reaches 100%
              status: newProgress >= 100 ? 'completed' : g.status,
              updatedAt: getCurrentTimestamp(),
            };
          }
          return g;
        });
        setGoals(updatedGoals);
        
        // Check if goal was auto-completed
        const wasAutoCompleted = validateProgress(result.fallback.overall_progress) >= 100 && 
                                 goals.find(g => g.id === goalId)?.status !== 'completed';
        
        let feedbackMessage = result.fallback.feedback;
        if (wasAutoCompleted) {
          feedbackMessage = `🎉 Congratulations! Goal completed! ${result.fallback.feedback}`;
        }
        
        setLatestFeedback(feedbackMessage);
        setLatestProgressIncrease(result.fallback.progress_increase);
        setLatestReasoning(result.fallback.reasoning);
        setUpdates(prev => [...prev, newUpdate]);
      }
      throw new Error(result.error || 'Failed to analyze progress');
      }

    } catch (error) {
      console.error('Error submitting progress update:', error);
      
      // Still save the update even if LLM analysis failed
      const updateId = generateId();
      const timestamp = getCurrentTimestamp();
      
      const fallbackFeedback = 'Your progress has been recorded. AI analysis is temporarily unavailable.';
      const newUpdate: ProgressUpdate = {
        id: updateId,
        goalId,
        journalEntry,
        timestamp,
        llmResponse: {
          overall_progress: goal?.overallProgress || 0,
          progress_increase: 0,
          reasoning: 'Unable to analyze progress due to technical issues',
          feedback: fallbackFeedback
        }
      };

      setLatestFeedback(fallbackFeedback);
      setLatestProgressIncrease(0);
      setLatestReasoning('Unable to analyze progress due to technical issues');
      setUpdates(prev => [...prev, newUpdate]);
      
      // You could show an error toast here
      alert('Progress recorded, but AI analysis failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCoaching = async (goalId: string, userInput?: string) => {
    setIsLoading(true);
    
    // Find the goal
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Get previous updates for this goal to provide context
      const previousUpdates = updates.filter(update => update.goalId === goalId);
      
      // Call the coaching API
      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal,
          previousUpdates,
          userInput,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Process the coaching response and store it by goal ID
        const coachingData: LLMCoachingResponse = result.data;
        setCoachingResponses(prev => ({
          ...prev,
          [goalId]: coachingData
        }));
        console.log('Coaching advice received for goal:', goalId, coachingData);
        
      } else {
        // Handle API error - use fallback if available
        if (result.fallback) {
          setCoachingResponses(prev => ({
            ...prev,
            [goalId]: result.fallback
          }));
        }
        throw new Error(result.error || 'Failed to get coaching advice');
      }

    } catch (error) {
      console.error('Error getting coaching advice:', error);
      
      // Show error message
      alert('Failed to get coaching advice. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dashboard
      goals={goals}
      updates={updates}
      onGoalsChange={handleGoalsChange}
      onSubmitUpdate={handleSubmitUpdate}
      onGetCoaching={handleGetCoaching}
      isLoading={isLoading}
      latestFeedback={latestFeedback}
      latestProgressIncrease={latestProgressIncrease}
      latestReasoning={latestReasoning}
      coachingResponses={coachingResponses}
    />
  );
}
