import React from 'react';
import { Sun, Moon, Volume2, VolumeX, Database, Flame } from 'lucide-react';
import { Theme } from '../types';
import { sound } from '../utils/audio';

interface HeaderProps {
  theme: Theme;
  onThemeToggle: () => void;
  streak: number;
  onOpenDataModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onThemeToggle,
  streak,
  onOpenDataModal,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" className="pulse-svg" width="24" height="24">
            <path
              d="M3 16h6l3-7 4 15 4-11 3 5h6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="brand-text">
          <h1 className="brand-title">Wellness Pulse</h1>
          <span className="brand-subtitle">Calm & Private Sanctuary</span>
        </div>
      </div>

      <div className="header-actions">
        {streak > 0 && (
          <div className="streak-badge" title={`${streak} consecutive days of mindful check-ins!`}>
            <Flame className="streak-icon" size={16} />
            <span className="streak-count">{streak}</span>
            <span className="streak-label">day streak</span>
          </div>
        )}

        <button
          type="button"
          className="header-btn"
          id="sound-toggle-btn"
          onClick={() => {
            onToggleSound();
            if (!soundEnabled) {
              sound.playTap();
            }
          }}
          title={soundEnabled ? 'Mute soothing audio cues' : 'Enable soothing audio cues'}
          aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          type="button"
          className="header-btn"
          id="theme-toggle-btn"
          onClick={() => {
            sound.playTap();
            onThemeToggle();
          }}
          title={`Switch theme (currently ${theme})`}
          aria-label="Toggle dark/light theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          className="header-btn header-btn-secondary"
          id="data-backup-btn"
          onClick={() => {
            sound.playTap();
            onOpenDataModal();
          }}
          title="Backup, export, or manage your data"
          aria-label="Manage data & backup"
        >
          <Database size={18} />
          <span className="btn-text-desktop">Data</span>
        </button>
      </div>
    </header>
  );
};
