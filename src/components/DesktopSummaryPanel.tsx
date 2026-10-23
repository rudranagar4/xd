import React from 'react';
import { Sparkles, CheckCircle2, Flame, Wind, ArrowRight, Sun, Moon, Volume2, VolumeX, Database } from 'lucide-react';
import { State, MoodLevel, EnergyLevel } from '../types';
import { MOOD_COLORS, calculateStreak, getRecommendedSuggestions } from '../constants';
import { PulseOrb } from './PulseOrb';
import { sound } from '../utils/audio';

interface Props {
  state: State;
  onGoTab: (tabId: 'checkin' | 'journal' | 'insights' | 'care') => void;
  onToggleAction: (key: string, date: string) => void;
  onThemeToggle: () => void;
  onOpenDataModal: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  pulseTrigger: number;
}

export const DesktopSummaryPanel: React.FC<Props> = ({
  state,
  onGoTab,
  onToggleAction,
  onThemeToggle,
  onOpenDataModal,
  soundEnabled,
  onToggleSound,
  pulseTrigger,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const todayCI = state.checkIns.find((c) => c.date === today);
  const streak = calculateStreak(state.checkIns);

  const displayMood: MoodLevel = todayCI ? todayCI.mood : 3;
  const displayEnergy: EnergyLevel = todayCI ? todayCI.energy : 3;

  const suggestions = getRecommendedSuggestions(state.checkIns);
  const topAction = suggestions[0];
  const isTopDone = topAction
    ? state.actions.some((a) => a.date === today && a.suggestionKey === topAction.key && a.done)
    : false;

  const isDark =
    state.theme === 'dark' ||
    (state.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <aside className="desktop-summary-panel" aria-label="Today's pulse and summary">
      {/* Header with utilities */}
      <div className="summary-header">
        <div>
          <span className="summary-eyebrow">Today's Pulse</span>
          <h2 className="summary-date">{todayFormatted}</h2>
        </div>
        <div className="summary-util-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute soothing audio' : 'Enable soothing audio'}
            aria-label="Toggle soothing sound"
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onThemeToggle}
            title="Toggle theme"
            aria-label="Toggle light or dark theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={onOpenDataModal}
            title="Data backup & settings"
            aria-label="Open data backup dialog"
          >
            <Database size={16} />
          </button>
        </div>
      </div>

      {/* Mini live Pulse Orb card */}
      <div className="summary-orb-card">
        <PulseOrb
          mood={displayMood}
          energy={displayEnergy}
          pulseTrigger={pulseTrigger}
          size={160}
          interactive={false}
        />
        <div className="summary-orb-status">
          {todayCI ? (
            <div className="status-badge recorded">
              <span className="status-dot" style={{ background: MOOD_COLORS[todayCI.mood] }} />
              <span>Today's reflection recorded</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-xs summary-checkin-cta"
              onClick={() => onGoTab('checkin')}
            >
              Take today's check-in <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Quick streak banner */}
      <div className="summary-metric-row">
        <div className="summary-metric-card">
          <div className="metric-header">
            <Flame size={14} className="metric-flame-icon" />
            <span>Streak</span>
          </div>
          <div className="metric-val">{streak} {streak === 1 ? 'day' : 'days'}</div>
          <div className="metric-caption">{streak > 0 ? 'Consecutive check-ins' : 'Start your streak today'}</div>
        </div>

        <div className="summary-metric-card">
          <div className="metric-header">
            <CheckCircle2 size={14} style={{ color: 'var(--sage)' }} />
            <span>Journal</span>
          </div>
          <div className="metric-val">{state.entries.length}</div>
          <div className="metric-caption">Private reflections</div>
        </div>
      </div>

      {/* Recommended small action */}
      {topAction && (
        <div className="summary-action-card">
          <div className="summary-action-header">
            <span className="action-pill-tag"><Sparkles size={11} /> Next small step</span>
            <button
              type="button"
              className={`action-check-toggle ${isTopDone ? 'checked' : ''}`}
              onClick={() => {
                sound.playTap();
                onToggleAction(topAction.key, today);
              }}
              title={isTopDone ? 'Mark as incomplete' : 'Mark as done'}
              aria-label="Toggle action completion"
            >
              {isTopDone ? <CheckCircle2 size={16} /> : <span className="empty-circle" />}
              <span>{isTopDone ? 'Done' : 'Mark done'}</span>
            </button>
          </div>
          <div className="summary-action-title">{topAction.title}</div>
          <div className="summary-action-why">{topAction.why}</div>
        </div>
      )}

      {/* Quick Mindful Breath launcher */}
      <div className="summary-breath-launcher">
        <div className="breath-info">
          <div className="breath-icon-box">
            <Wind size={18} />
          </div>
          <div>
            <div className="breath-title">4-2-8 Reset Breath</div>
            <div className="breath-sub">2 minutes to calm nervous system</div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-xs breath-btn"
          onClick={() => onGoTab('care')}
        >
          Begin <ArrowRight size={12} />
        </button>
      </div>
    </aside>
  );
};
