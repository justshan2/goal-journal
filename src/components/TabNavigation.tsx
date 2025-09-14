'use client';

import React from 'react';

export type TabType = 'goals' | 'journal' | 'coaching';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  return (
    <div className="mb-8">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => onTabChange('goals')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'goals'
                ? 'border-warm-500 text-warm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">🎯</span>
              <span>Goals Dashboard</span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('journal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'journal'
                ? 'border-warm-500 text-warm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">📝</span>
              <span>Journal Entry</span>
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('coaching')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'coaching'
                ? 'border-warm-500 text-warm-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">💡</span>
              <span>Coaching</span>
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};
