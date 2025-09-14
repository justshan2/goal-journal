'use client';

import React, { useState } from 'react';
import { Goal, ProgressUpdate } from '@/types';
import { GoalCard } from './GoalCard';
import { GoalDetailModal } from './GoalDetailModal';
import { ProgressInput } from './ProgressInput';
import { CoachingInput } from './CoachingInput';
import { TabNavigation, TabType } from './TabNavigation';
import { generateId, getCurrentTimestamp } from '@/lib/utils';
import { saveGoals, resetGoals } from '@/lib/storage';

interface DashboardProps {
  goals: Goal[];
  updates: ProgressUpdate[];
  onGoalsChange: (goals: Goal[]) => void;
  onSubmitUpdate: (goalId: string, journalEntry: string) => Promise<void>;
  onGetCoaching: (goalId: string, userInput?: string) => Promise<void>;
  isLoading?: boolean;
  latestFeedback?: string;
  latestProgressIncrease?: number;
  latestReasoning?: string;
  coachingResponses: Record<string, any>;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (title: string, description: string, initialProgress: string, context: string) => void;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAddGoal }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [initialProgress, setInitialProgress] = useState('');
  const [context, setContext] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAddGoal(title.trim(), description.trim(), initialProgress.trim(), context.trim());
      setTitle('');
      setDescription('');
      setInitialProgress('');
      setContext('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-warm-100 to-warm-200 rounded-full flex items-center justify-center">
            <span className="text-xl">🎯</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Add New Goal</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="goal-title" className="block text-sm font-medium text-gray-700 mb-2">
              Goal Title *
            </label>
            <input
              type="text"
              id="goal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 transition-all duration-200"
              placeholder="e.g., Learn React, Get in Shape, Start a Business"
              required
            />
          </div>
          
          <div>
            <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              id="goal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 resize-vertical transition-all duration-200"
              rows={3}
              placeholder="Describe what you want to achieve..."
            />
          </div>

          <div>
            <label htmlFor="initial-progress" className="block text-sm font-medium text-gray-700 mb-2">
              Initial Progress (optional)
            </label>
            <input
              type="text"
              id="initial-progress"
              value={initialProgress}
              onChange={(e) => setInitialProgress(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 transition-all duration-200"
              placeholder="e.g., 1302 rating in ultra ball 4, completed 3 chapters, etc."
            />
          </div>

          <div>
            <label htmlFor="goal-context" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (optional)
            </label>
            <textarea
              id="goal-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 resize-vertical transition-all duration-200"
              rows={2}
              placeholder="e.g., 1450 is the next rank, need to finish by end of month, etc."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700 text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              Add Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  goals, 
  updates,
  onGoalsChange, 
  onSubmitUpdate, 
  onGetCoaching,
  isLoading = false,
  latestFeedback = '',
  latestProgressIncrease,
  latestReasoning = '',
  coachingResponses
}) => {
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalDetailModal, setShowGoalDetailModal] = useState(false);

  const handleAddGoal = (title: string, description: string, initialProgress: string, context: string) => {
    const newGoal: Goal = {
      id: generateId(),
      title,
      description,
      initialProgress: initialProgress || undefined,
      context: context || undefined,
      overallProgress: 0,
      status: 'in-progress',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    const updatedGoals = [...goals, newGoal];
    onGoalsChange(updatedGoals);
    saveGoals(updatedGoals);
  };

  const handleStatusChange = (goalId: string, newStatus: 'in-progress' | 'paused' | 'completed') => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, status: newStatus, updatedAt: getCurrentTimestamp() }
        : goal
    );
    onGoalsChange(updatedGoals);
    saveGoals(updatedGoals);
  };

  const handleGoalCardClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowGoalDetailModal(true);
  };

  const handleCloseGoalDetailModal = () => {
    setShowGoalDetailModal(false);
    setSelectedGoal(null);
  };

  const handleResetGoals = () => {
    if (window.confirm('Are you sure you want to reset all goals? This action cannot be undone.')) {
      resetGoals();
      onGoalsChange([]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Goal Tracker</h1>
              <p className="text-gray-600 text-lg">Track your progress with AI-powered insights</p>
            </div>
            <div className="flex space-x-3">
              {goals.length > 0 && (
                <button
                  onClick={handleResetGoals}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Reset Goals
                </button>
              )}
              <button
                onClick={() => setShowAddGoalModal(true)}
                className="bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg"
              >
                + Add Goal
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        {activeTab === 'goals' && (
          <div>
            {/* Goals Grid */}
            {goals.length === 0 ? (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-warm-100 to-warm-200 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎯</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No goals yet</h3>
                  <p className="text-gray-600 mb-8 text-lg">Create your first goal to start tracking your progress with AI-powered insights</p>
                  <button
                    onClick={() => setShowAddGoalModal(true)}
                    className="bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg text-lg"
                  >
                    Create Your First Goal
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* In Progress Goals */}
                {goals.filter(goal => goal.status === 'in-progress').length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">In Progress</h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({goals.filter(goal => goal.status === 'in-progress').length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {goals
                        .filter(goal => goal.status === 'in-progress')
                        .map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onClick={() => handleGoalCardClick(goal)}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Paused Goals */}
                {goals.filter(goal => goal.status === 'paused').length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Paused</h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({goals.filter(goal => goal.status === 'paused').length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {goals
                        .filter(goal => goal.status === 'paused')
                        .map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onClick={() => handleGoalCardClick(goal)}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Completed Goals */}
                {goals.filter(goal => goal.status === 'completed').length > 0 && (
                  <div>
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">Completed</h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({goals.filter(goal => goal.status === 'completed').length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {goals
                        .filter(goal => goal.status === 'completed')
                        .map((goal) => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            onClick={() => handleGoalCardClick(goal)}
                            onStatusChange={handleStatusChange}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'journal' && (
          <div>
            <ProgressInput
              goals={goals}
              onSubmitUpdate={onSubmitUpdate}
              isLoading={isLoading}
              latestFeedback={latestFeedback}
              latestProgressIncrease={latestProgressIncrease}
              latestReasoning={latestReasoning}
            />
          </div>
        )}

        {activeTab === 'coaching' && (
          <div>
            <CoachingInput
              goals={goals}
              onGetCoaching={onGetCoaching}
              isLoading={isLoading}
              coachingResponses={coachingResponses}
            />
          </div>
        )}

        {/* Modals */}
        <AddGoalModal
          isOpen={showAddGoalModal}
          onClose={() => setShowAddGoalModal(false)}
          onAddGoal={handleAddGoal}
        />
        <GoalDetailModal
          goal={selectedGoal}
          updates={updates}
          isOpen={showGoalDetailModal}
          onClose={handleCloseGoalDetailModal}
        />
      </div>
    </div>
  );
};
