'use client';

import React from 'react';
import { Goal, ProgressUpdate } from '@/types';
import { formatProgress, getProgressBarColor } from '@/lib/utils';

interface GoalDetailModalProps {
  goal: Goal | null;
  updates: ProgressUpdate[];
  isOpen: boolean;
  onClose: () => void;
}

const ProgressBar: React.FC<{ progress: number; label?: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  progress, 
  label, 
  size = 'md' 
}) => {
  const heightClass = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }[size];

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-lg font-bold text-gray-900">{formatProgress(progress)}</span>
        </div>
      )}
      <div className={`w-full bg-gray-100 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out ${getProgressBarColor(progress)}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ 
  goal, 
  updates, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !goal) return null;

  const goalUpdates = updates.filter(update => update.goalId === goal.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-warm-500 to-warm-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{goal.title}</h2>
              {goal.description && (
                <p className="text-warm-100 mt-2">{goal.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-warm-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Goal Details */}
            <div className="space-y-6">
              {/* Overall Progress */}
              <div>
                <ProgressBar 
                  progress={goal.overallProgress} 
                  label="Overall Progress" 
                  size="lg"
                />
              </div>

              {/* Initial Progress */}
              {goal.initialProgress && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-600 text-lg">📍</span>
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-2">Initial Progress</h3>
                      <p className="text-sm text-blue-700">{goal.initialProgress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Context */}
              {goal.context && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-gray-600 text-lg">ℹ️</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Context</h3>
                      <p className="text-sm text-gray-600">{goal.context}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Goal Metadata */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Goal Information</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(goal.createdAt).toLocaleDateString()}</span>
                  </div>
                  {goal.updatedAt !== goal.createdAt && (
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date(goal.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Journal Entries:</span>
                    <span>{goalUpdates.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Journal Entries */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Journal Entries</h3>
              {goalUpdates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📝</span>
                  </div>
                  <p>No journal entries yet</p>
                  <p className="text-sm">Start tracking your progress in the Journal tab</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {goalUpdates
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((update) => (
                    <div key={update.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">
                          {new Date(update.timestamp).toLocaleDateString()} at {new Date(update.timestamp).toLocaleTimeString()}
                        </span>
                        {update.llmResponse && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            update.llmResponse.progress_increase > 0 
                              ? 'bg-green-100 text-green-800' 
                              : update.llmResponse.progress_increase < 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {update.llmResponse.progress_increase > 0 ? '+' : ''}{update.llmResponse.progress_increase}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{update.journalEntry}</p>
                      {update.llmResponse && (
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-warm-400">
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>AI Feedback:</strong> {update.llmResponse.feedback}
                          </p>
                          <p className="text-xs text-gray-500">
                            <strong>Reasoning:</strong> {update.llmResponse.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
