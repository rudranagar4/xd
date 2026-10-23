import React from 'react';
import { Activity, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { TabId } from '../types';
import { sound } from '../utils/audio';

interface NavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  actionsPendingCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  actionsPendingCount = 0,
}) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'checkin', label: 'Check-In', icon: <Activity size={20} /> },
    { id: 'journal', label: 'Journal', icon: <BookOpen size={20} /> },
    { id: 'insights', label: 'Insights', icon: <TrendingUp size={20} /> },
    {
      id: 'care',
      label: 'Gentle Care',
      icon: <Sparkles size={20} />,
      badge: actionsPendingCount > 0 ? actionsPendingCount : undefined,
    },
  ];

  return (
    <nav className="tab-nav" aria-label="Main application tabs">
      <div className="tab-nav-inner">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-btn-${tab.id}`}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                sound.playTap();
                onTabChange(tab.id);
              }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="tab-badge" title={`${tab.badge} care actions pending`}>
                  {tab.badge}
                </span>
              )}
              {isActive && <span className="tab-active-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
