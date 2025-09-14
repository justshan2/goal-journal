'use client';

import React, { useState } from 'react';
import { Goal } from '../types';

interface ProgressInputProps {
  goals: Goal[];
  onSubmitUpdate: (goalId: string, journalEntry: string) => Promise<void>;
  isLoading?: boolean;
  latestFeedback?: string;
  latestProgressIncrease?: number;
  latestReasoning?: string;
}

export const ProgressInput: React.FC<ProgressInputProps> = ({ 
  goals, 
  onSubmitUpdate, 
  isLoading = false,
  latestFeedback = '',
  latestProgressIncrease,
  latestReasoning = ''
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [journalEntry, setJournalEntry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoalId || !journalEntry.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSubmitUpdate(selectedGoalId, journalEntry.trim());
      setJournalEntry('');
      setSelectedGoalId('');
    } catch (error) {
      console.error('Error submitting progress update:', error);
      // You could add a toast notification here
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGoalId(e.target.value);
  };

  const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJournalEntry(e.target.value);
  };

  const isFormValid = selectedGoalId && journalEntry.trim() && !isSubmitting && !isLoading;

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-warm-100 to-warm-200 rounded-full flex items-center justify-center">
          <span className="text-xl">📝</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">Progress Update</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Goal Selection */}
        <div>
          <label htmlFor="goal-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Goal
          </label>
          <select
            id="goal-select"
            value={selectedGoalId}
            onChange={handleGoalChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 transition-all duration-200"
            disabled={isSubmitting || isLoading}
          >
            <option value="">Choose a goal...</option>
            {goals
              .filter(goal => goal.status === 'in-progress')
              .map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title} ({Math.round(goal.overallProgress)}%)
                </option>
              ))}
          </select>
        </div>

        {/* Journal Entry */}
        <div>
          <label htmlFor="journal-entry" className="block text-sm font-medium text-gray-700 mb-2">
            What did you work on today?
          </label>
          <textarea
            id="journal-entry"
            value={journalEntry}
            onChange={handleJournalChange}
            placeholder="Share your progress, challenges, or insights. The AI will analyze this and update your goal progress automatically..."
            rows={6}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 resize-vertical transition-all duration-200"
            disabled={isSubmitting || isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Be specific about what you accomplished, what you&apos;re working on, or any obstacles you encountered.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!isFormValid}
            className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 ${
              isFormValid
                ? 'bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              'Submit Update'
            )}
          </button>
        </div>
      </form>

      {/* AI Feedback Display */}
      {latestFeedback && (
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-blue-600 text-lg">🤖</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-sm font-semibold text-blue-900">AI Coach</h4>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Online</span>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                {/* Progress Increase and Reasoning */}
                {(latestProgressIncrease !== undefined || latestReasoning) && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Progress Analysis</span>
                      {latestProgressIncrease !== undefined && (
                        <span className={`text-sm font-bold px-2 py-1 rounded-full ${
                          latestProgressIncrease > 0 
                            ? 'bg-green-100 text-green-700' 
                            : latestProgressIncrease < 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {latestProgressIncrease > 0 ? '+' : ''}{latestProgressIncrease}%
                        </span>
                      )}
                    </div>
                    {latestReasoning && (
                      <p className="text-xs text-gray-600 italic">{latestReasoning}</p>
                    )}
                  </div>
                )}
                
                {/* Main Feedback */}
                <p className="text-sm text-gray-800 leading-relaxed">{latestFeedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gradient-to-r from-warm-50 to-orange-50 border border-warm-200 rounded-xl">
        <p className="text-sm text-warm-800">
          <strong>💡 Tip:</strong> The AI will analyze your update and automatically adjust your goal progress. 
          It will also provide feedback and suggestions for next steps!
        </p>
      </div>
    </div>
  );
};
