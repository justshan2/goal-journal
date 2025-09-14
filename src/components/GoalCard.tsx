'use client';

import React from 'react';
import { Goal } from '../types';
import { formatProgress, getProgressBarColor } from '../lib/utils';

interface GoalCardProps {
  goal: Goal;
  onClick?: () => void;
  onStatusChange?: (goalId: string, newStatus: 'in-progress' | 'paused' | 'completed') => void;
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

export const GoalCard: React.FC<GoalCardProps> = ({ 
  goal,
  onClick,
  onStatusChange
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-400';
      case 'paused': return 'bg-yellow-400';
      case 'in-progress': 
      default: 
        if (goal.overallProgress === 0) return 'bg-gray-400';
        if (goal.overallProgress < 25) return 'bg-red-400';
        if (goal.overallProgress < 50) return 'bg-blue-400';
        if (goal.overallProgress < 75) return 'bg-blue-500';
        return 'bg-green-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'paused': return 'Paused';
      case 'in-progress':
      default:
        if (goal.overallProgress === 0) return 'Not Started';
        if (goal.overallProgress < 25) return 'Getting Started';
        if (goal.overallProgress < 50) return 'In Progress';
        if (goal.overallProgress < 75) return 'Making Good Progress';
        if (goal.overallProgress === 100) return 'Complete';
        return 'Almost There';
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation(); // Prevent card click
    const newStatus = e.target.value as 'in-progress' | 'paused' | 'completed';
    onStatusChange?.(goal.id, newStatus);
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
        goal.status === 'completed' 
          ? 'border-green-200 bg-green-50' 
          : goal.status === 'paused'
          ? 'border-yellow-200 bg-yellow-50'
          : 'border-gray-100'
      }`}
      onClick={onClick}
    >
      {/* Goal Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">{goal.title}</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(goal.status)}`}></div>
            <span className="text-xs text-gray-500">{getStatusText(goal.status)}</span>
          </div>
        </div>
        
        {goal.description && (
          <p className="text-gray-600 mb-4 leading-relaxed line-clamp-2">{goal.description}</p>
        )}
      </div>

      {/* Status Control */}
      <div className="mb-4">
        <select
          value={goal.status}
          onChange={handleStatusChange}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-warm-500 focus:border-warm-500 bg-white"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="in-progress">In Progress</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Goal Metadata */}
      <div className="text-xs text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex items-center justify-between">
          <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
          {goal.updatedAt !== goal.createdAt && (
            <span>Updated: {new Date(goal.updatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
};
