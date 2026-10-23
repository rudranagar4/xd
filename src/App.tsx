import React, { useState, useEffect, useCallback } from 'react';
import { Activity, BookOpen, TrendingUp, Sparkles, Moon, Sun, Database, Volume2, VolumeX, Flame } from 'lucide-react';
import { State, CheckIn, Entry, Action, TabId, ToastMsg } from './types';
import { loadState, saveState, clearState } from './utils/storage';
import { buildSampleState, calculateStreak, MOOD_COLORS, MOOD_CONFIG } from './constants';
import { sound } from './utils/audio';

import { CheckInTab } from './components/CheckInTab';
import { JournalTab } from './components/JournalTab';
import { InsightsTab } from './components/InsightsTab';
import { CareTab } from './components/CareTab';
import { Toast } from './components/Toast';
import { LiveFluidBackground } from './components/LiveFluidBackground';
import { DesktopSummaryPanel } from './components/DesktopSummaryPanel';
import { DataModal } from './components/DataModal';

// Brand SVG logo
const BrandLogo = () => (
  <svg viewBox="0 0 32 32" width="100%" height="100%" fill="none" aria-hidden="true">
    <circle cx="16" cy="16" r="14" fill="var(--sage)" opacity="0.22" />
    <path
      d="M5 16h5l3-7 4 14 3-8 3 4 4-3"
      stroke="var(--sage-deep)"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NAV_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'checkin',  label: 'Check-in', icon: <Activity size={20} /> },
  { id: 'journal',  label: 'Journal',  icon: <BookOpen size={20} /> },
  { id: 'insights', label: 'Insights', icon: <TrendingUp size={20} /> },
  { id: 'care',     label: 'Care',     icon: <Sparkles size={20} /> },
];

export const App: React.FC = () => {
  const [state, setState] = useState<State>(() => loadState());
  const [tab, setTab] = useState<TabId>('checkin');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [journalPrefill, setJournalPrefill] = useState('');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  // Sync sound controller enabled state
  useEffect(() => {
    sound.enabled = soundEnabled;
  }, [soundEnabled]);

  // Apply theme to documentElement
  useEffect(() => {
    let effectiveTheme: 'light' | 'dark' = 'light';
    if (state.theme === 'dark') effectiveTheme = 'dark';
    else if (state.theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [state.theme]);

  // Persist state in localStorage with safe error handling
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Toast dispatch
  const toast = useCallback((message: string, type: ToastMsg['type'] = 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  const [scrollPercent, setScrollPercent] = useState(0);

  // Track window scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollPercent(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
      } else {
        setScrollPercent(0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tab]);

  // Smooth scroll reveal observer for cards entering viewport
  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('scroll-in-view');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -25px 0px' }
    );

    const targets = document.querySelectorAll(
      '.card, .entry-card, .sugg-card, .history-row, .next-step-card, .grounding-item, .resource-card'
    );
    targets.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [tab, state]);

  // ── Tab Navigation with Spring, Audio & Smooth Scroll ─────────
  const handleTabChange = (newTab: TabId) => {
    sound.playTap();
    setTab(newTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── CheckIn handlers ──────────────────────────────────────────
  const handleSaveCheckIn = (data: Omit<CheckIn, 'id' | 'ts'>) => {
    const ts = Date.now();
    setState(prev => {
      const idx = prev.checkIns.findIndex(c => c.date === data.date);
      let checkIns: CheckIn[];
      if (idx >= 0) {
        checkIns = prev.checkIns.map((c, i) => (i === idx ? { ...c, ...data, ts } : c));
      } else {
        checkIns = [...prev.checkIns, { id: `ci-${ts}`, ts, ...data }];
      }
      return { ...prev, checkIns };
    });
    setPulseTrigger(n => n + 1);
    toast('Check-in saved', 'success');
  };

  const handleDeleteCheckIn = (id: string) => {
    sound.playTap();
    setState(prev => ({ ...prev, checkIns: prev.checkIns.filter(c => c.id !== id) }));
    toast('Check-in removed', 'info');
  };

  // ── Journal handlers ──────────────────────────────────────────
  const handleSaveEntry = (data: Omit<Entry, 'id' | 'ts'>) => {
    const ts = Date.now();
    setState(prev => ({
      ...prev,
      entries: [...prev.entries, { id: `e-${ts}`, ts, ...data }],
    }));
    toast('Reflection saved to private journal', 'success');
    setJournalPrefill('');
  };

  const handleUpdateEntry = (updated: Entry) => {
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => (e.id === updated.id ? updated : e)),
    }));
    toast('Reflection updated', 'success');
  };

  const handleDeleteEntry = (id: string) => {
    sound.playTap();
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
    toast('Reflection deleted', 'info');
  };

  // ── Action (Care) handlers ────────────────────────────────────
  const handleToggleAction = (key: string, date: string) => {
    setState(prev => {
      const idx = prev.actions.findIndex(a => a.date === date && a.suggestionKey === key);
      if (idx >= 0) {
        const actions = prev.actions.map((a, i) => (i === idx ? { ...a, done: !a.done } : a));
        return { ...prev, actions };
      }
      const newAct: Action = { id: `act-${Date.now()}`, date, suggestionKey: key, done: true };
      return { ...prev, actions: [...prev.actions, newAct] };
    });
  };

  // ── Go to journal from check-in ───────────────────────────────
  const handleGoJournal = (prompt: string) => {
    sound.playTap();
    setJournalPrefill(prompt);
    setTab('journal');
  };

  // ── Theme toggle ──────────────────────────────────────────────
  const handleThemeToggle = () => {
    sound.playTap();
    setState(prev => {
      const nextTheme = prev.theme === 'dark' ? 'light' : 'dark';
      return { ...prev, theme: nextTheme };
    });
  };

  // ── Sound toggle ──────────────────────────────────────────────
  const handleToggleSound = () => {
    setSoundEnabled(prev => !prev);
  };

  // ── Demo & Clear handlers ─────────────────────────────────────
  const handleLoadSample = () => {
    sound.playSuccess();
    setState(buildSampleState());
    toast('Sample week loaded!', 'success');
  };

  const handleClearAll = () => {
    sound.playTap();
    setState(clearState());
    toast('All data cleared.', 'info');
  };

  // ── Derived data ──────────────────────────────────────────────
  const streak = calculateStreak(state.checkIns);
  const today = new Date().toISOString().split('T')[0];
  const todayCI = state.checkIns.find(c => c.date === today);
  const pendingCare = state.actions.filter(a => a.date === today && !a.done).length;
  const isDark =
    state.theme === 'dark' ||
    (state.theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className="app-layout">
      {/* ── Scroll Progress Indicator ───────────────────────────── */}
      <div className="scroll-progress-track" aria-hidden="true">
        <div
          className="scroll-progress-fill"
          style={{ width: `${scrollPercent}%` }}
        />
      </div>

      {/* ── Dynamic Living Ambient Background ──────────────────── */}
      <LiveFluidBackground theme={state.theme} mood={todayCI ? todayCI.mood : 3} />

      {/* ── Desktop Sidebar (Left Column) ───────────────────────── */}
      <aside className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <BrandLogo />
          </div>
          <div>
            <div className="sidebar-title">Wellness Pulse</div>
            <div className="sidebar-sub">Calm &amp; private sanctuary</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV_TABS.map(t => (
            <button
              key={t.id}
              type="button"
              id={`sidebar-nav-${t.id}`}
              className={`sidebar-nav-btn ${tab === t.id ? 'active' : ''}`}
              onClick={() => handleTabChange(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className="sidebar-nav-icon">{t.icon}</span>
              <span className="sidebar-nav-label">{t.label}</span>
              {t.id === 'care' && pendingCare > 0 && (
                <span className="sidebar-nav-badge">{pendingCare}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Streak card in sidebar */}
        {streak > 0 && (
          <div className="sidebar-streak-card">
            <div className="sidebar-streak-icon">
              <Flame size={18} />
            </div>
            <div className="sidebar-streak-num">{streak}</div>
            <div className="sidebar-streak-label">{streak === 1 ? 'day' : 'days'} in a row</div>
            <div className="sidebar-streak-sub">Mindful pause maintained ✨</div>
          </div>
        )}

        {/* Sidebar footer controls */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="icon-btn"
            onClick={handleToggleSound}
            title={soundEnabled ? 'Mute soothing audio' : 'Enable soothing audio'}
            aria-label="Toggle soothing sound"
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={handleThemeToggle}
            title="Toggle light/dark theme"
            aria-label="Toggle light or dark theme"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsDataModalOpen(true)}
            title="Data backup & settings"
            aria-label="Open data backup dialog"
          >
            <Database size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main App Work Area (Center Column) ──────────────────── */}
      <div className="app-main">
        {/* Mobile header (Sticky at top on mobile) */}
        <header className="mobile-header">
          <div className="mhdr-brand">
            <div className="mhdr-logo">
              <BrandLogo />
            </div>
            <span className="mhdr-title">Wellness Pulse</span>
          </div>

          <div className="mhdr-actions">
            {/* Live pulse indicator in header — shows today's saved mood color */}
            {todayCI && (
              <div
                className="header-mood-dot-pulse"
                style={{
                  background: MOOD_COLORS[todayCI.mood],
                  boxShadow: `0 0 0 3px ${MOOD_COLORS[todayCI.mood]}44`,
                }}
                title={`Today: ${MOOD_CONFIG[todayCI.mood].label} mood`}
              />
            )}

            {streak > 0 && (
              <span className="header-streak-pill">
                🔥 {streak}d
              </span>
            )}

            <button
              type="button"
              className="icon-btn"
              onClick={handleToggleSound}
              aria-label="Toggle soothing sound"
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
              title="Toggle light or dark theme"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={() => setIsDataModalOpen(true)}
              aria-label="Export or restore data"
              title="Data sanctuary & backup"
            >
              <Database size={17} />
            </button>
          </div>
        </header>

        {/* Tab view with fluid cross-fade and 12px slide transition */}
        <main className="tab-content" id="main-content" role="main">
          <div key={tab} className="tab-pane-transition">
            {tab === 'checkin' && (
              <CheckInTab
                state={state}
                onSave={handleSaveCheckIn}
                onDelete={handleDeleteCheckIn}
                onGoJournal={handleGoJournal}
                pulseTrigger={pulseTrigger}
              />
            )}
            {tab === 'journal' && (
              <JournalTab
                state={state}
                prefillPrompt={journalPrefill}
                onSave={handleSaveEntry}
                onUpdate={handleUpdateEntry}
                onDelete={handleDeleteEntry}
              />
            )}
            {tab === 'insights' && (
              <InsightsTab
                state={state}
                onLoadSample={handleLoadSample}
                onClearAll={handleClearAll}
              />
            )}
            {tab === 'care' && (
              <CareTab
                state={state}
                onToggleAction={handleToggleAction}
              />
            )}
          </div>
        </main>

        {/* Floating Mobile Bottom Pill Nav */}
        <nav className="bottom-nav" aria-label="Main application tabs">
          <div className="bottom-nav-inner">
            {NAV_TABS.map(t => (
              <button
                key={t.id}
                id={`bnav-${t.id}`}
                type="button"
                className={`bnav-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => handleTabChange(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
              >
                {t.id === 'care' && pendingCare > 0 && (
                  <span className="bnav-badge">{pendingCare}</span>
                )}
                <span className="bnav-icon">{t.icon}</span>
                <span className="bnav-text">{t.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* ── Desktop Summary Panel (Right Column: Today's pulse + summary) ── */}
      <DesktopSummaryPanel
        state={state}
        onGoTab={handleTabChange}
        onToggleAction={handleToggleAction}
        onThemeToggle={handleThemeToggle}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        pulseTrigger={pulseTrigger}
      />

      {/* Data Sanctuary & Backups Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        state={state}
        onStateUpdate={setState}
        onShowToast={toast}
      />

      {/* Accessible Notifications / Toast System */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
