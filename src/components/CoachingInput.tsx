'use client';

import React, { useState } from 'react';
import { Goal, LLMCoachingResponse } from '../types';

interface CoachingInputProps {
  goals: Goal[];
  onGetCoaching: (goalId: string, userInput?: string) => Promise<void>;
  isLoading: boolean;
  coachingResponses: Record<string, LLMCoachingResponse>;
}

export const CoachingInput: React.FC<CoachingInputProps> = ({
  goals,
  onGetCoaching,
  isLoading,
  coachingResponses
}) => {
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId) return;
    
    await onGetCoaching(selectedGoalId, userInput.trim() || undefined);
  };

  const selectedGoal = goals.find(goal => goal.id === selectedGoalId);
  const coachingResponse = selectedGoalId ? coachingResponses[selectedGoalId] : undefined;
  
  // Auto-select first in-progress goal if none selected and there are in-progress goals available
  React.useEffect(() => {
    const inProgressGoals = goals.filter(goal => goal.status === 'in-progress');
    if (!selectedGoalId && inProgressGoals.length > 0) {
      setSelectedGoalId(inProgressGoals[0].id);
    }
  }, [goals, selectedGoalId]);

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-2xl flex items-center justify-center shadow-sm">
            <span className="text-purple-600 text-2xl">🎯</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Goal Coaching</h2>
            <p className="text-gray-600 mt-1">Get strategic advice and milestones for your goals</p>
          </div>
        </div>

        {/* Goal Selection Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="goal-select" className="block text-sm font-medium text-gray-700 mb-3">
              Select a goal to get coaching advice for:
            </label>
            <select
              id="goal-select"
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200"
              required
            >
              <option value="">Choose a goal...</option>
              {goals
                .filter(goal => goal.status === 'in-progress')
                .map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title} ({goal.overallProgress}% complete){coachingResponses[goal.id] ? ' - Has coaching advice' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="user-input" className="block text-sm font-medium text-gray-700 mb-3">
              Specific Question or Request (optional):
            </label>
            <textarea
              id="user-input"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 bg-white transition-all duration-200 resize-vertical"
              rows={3}
              placeholder="e.g., 'I'm struggling with how to improve', 'What should I focus on this week?', 'How can I improve my consistency?'"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedGoalId || isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Getting Coaching Advice...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>{coachingResponse ? 'Refresh Coaching Advice' : 'Get Strategic Coaching'}</span>
              </>
            )}
          </button>
        </form>

        {/* Coaching Response */}
        {coachingResponse && selectedGoal && (
          <div className="mt-8 space-y-6">
            {/* Goal Context */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Coaching for: {selectedGoal.title}</h3>
              <p className="text-purple-700 text-sm">
                Current Progress: {selectedGoal.overallProgress}% • 
                {selectedGoal.description && ` ${selectedGoal.description}`}
              </p>
            </div>

            {/* Milestones */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>🏆</span>
                <span>Key Milestones</span>
              </h3>
              <div className="space-y-4">
                {coachingResponse.milestones.map((milestone, index) => (
                  <div key={index} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        milestone.priority === 'high' ? 'bg-red-100 text-red-700' :
                        milestone.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {milestone.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                    <p className="text-xs text-gray-500">Timeline: {milestone.timeline}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Habits */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>🔄</span>
                <span>Key Habits</span>
              </h3>
              <div className="space-y-4">
                {coachingResponse.habits.map((habit, index) => (
                  <div key={index} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{habit.name}</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {habit.frequency}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{habit.description}</p>
                    <p className="text-xs text-gray-500">Impact: {habit.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Advice */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-blue-600 text-lg">💡</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-lg font-semibold text-blue-900">Strategic Advice</h4>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Expert Guidance</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                    <p className="text-sm text-gray-800 leading-relaxed">{coachingResponse.advice}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Tip:</strong> Select a goal to get personalized coaching advice, including key milestones, 
            actionable habits, and strategic guidance tailored to your specific situation.
          </p>
        </div>
      </div>
    </div>
  );
};
