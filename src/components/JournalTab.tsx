import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen, Shuffle, Search, Trash2, Calendar, Tag, Lock, PenLine, Edit3, X, Check
} from 'lucide-react';
import { Entry, MoodLevel, EnergyLevel, State } from '../types';
import {
  MOOD_CONFIG, MOOD_COLORS, ENERGY_CONFIG, getMoodPrompts
} from '../constants';
import { sound } from '../utils/audio';

interface Props {
  state: State;
  prefillPrompt: string;
  onSave:   (e: Omit<Entry,'id'|'ts'>) => void;
  onUpdate: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

type FilterMode = 'all' | '7d' | MoodLevel;

export const JournalTab: React.FC<Props> = ({
  state,
  prefillPrompt,
  onSave,
  onUpdate,
  onDelete,
}) => {
  const today = new Date().toISOString().split('T')[0];

  // Today's check-in for automatic stamp
  const todayCI = state.checkIns.find(c => c.date === today);
  const latestMood = (state.checkIns.slice().sort((a,b) => b.date.localeCompare(a.date))[0]?.mood) as MoodLevel | undefined;

  const moodPrompts = useMemo(() => getMoodPrompts(latestMood), [latestMood]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [activePrompt, setActivePrompt] = useState(prefillPrompt || moodPrompts[0]);

  useEffect(() => {
    if (prefillPrompt) {
      setActivePrompt(prefillPrompt);
    } else {
      setActivePrompt(moodPrompts[promptIdx % moodPrompts.length]);
    }
  }, [prefillPrompt, promptIdx, moodPrompts]);

  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [savedNotice, setSavedNotice] = useState(false);

  // Edit mode state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const shufflePrompt = () => {
    sound.playTap();
    setPromptIdx(i => (i + 1) % moodPrompts.length);
  };

  const handleSave = () => {
    if (!text.trim()) return;
    sound.playSuccess();
    onSave({
      date:   today,
      prompt: activePrompt,
      text:   text.trim(),
      mood:   todayCI?.mood,
      energy: todayCI?.energy,
      tags:   todayCI?.tags ?? [],
    });
    setText('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3500);
  };

  const handleStartEdit = (entry: Entry) => {
    sound.playTap();
    setEditingId(entry.id);
    setEditText(entry.text);
  };

  const handleSaveEdit = (entry: Entry) => {
    if (!editText.trim()) return;
    sound.playSuccess();
    onUpdate({ ...entry, text: editText.trim() });
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    sound.playTap();
    setEditingId(null);
    setEditText('');
  };

  // Live filter & search across text, prompt, tag, or mood label (e.g. "low", "sleep")
  const filtered = useMemo(() => {
    const sevenDaysAgo = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    })();

    return state.entries
      .filter(e => {
        if (filter === '7d') return e.date >= sevenDaysAgo;
        if (typeof filter === 'number') return e.mood === filter;
        return true;
      })
      .filter(e => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        const moodLabel = e.mood ? MOOD_CONFIG[e.mood as MoodLevel]?.label.toLowerCase() : '';
        const energyLabel = e.energy ? ENERGY_CONFIG[e.energy as EnergyLevel]?.label.toLowerCase() : '';
        return (
          e.text.toLowerCase().includes(q) ||
          e.prompt.toLowerCase().includes(q) ||
          moodLabel.includes(q) ||
          energyLabel.includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.ts - a.ts);
  }, [state.entries, filter, search]);

  return (
    <div className="tab-pane">
      {/* Header */}
      <div className="tab-header-block">
        <h2>Private journal</h2>
        <div className="privacy-note">
          <Lock size={13} />
          <span>Stays on this device. No account, no upload.</span>
        </div>
      </div>

      {/* Compose card */}
      <div className="card">
        {/* Prompt Card */}
        <div className="prompt-box">
          <div className="prompt-header">
            <span className="prompt-label">
              <BookOpen size={13} style={{ display: 'inline', marginRight: '5px' }} />
              Thought starter
            </span>
            <button
              type="button"
              id="shuffle-prompt-btn"
              className="btn btn-ghost btn-xs"
              onClick={shufflePrompt}
            >
              <Shuffle size={12} /> Shuffle
            </button>
          </div>
          <p className="prompt-text">"{activePrompt}"</p>
        </div>

        {/* Textarea */}
        <textarea
          id="journal-textarea"
          className="textarea"
          rows={5}
          placeholder="Write as little or as much as you like — no right or wrong words…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="char-counter">{text.length} characters</div>

        {/* Automatic stamp badge from today's check-in */}
        {todayCI ? (
          <div className="stamp-hint">
            <span className="stamp-hint-text">Will be stamped with:</span>
            <span
              className="metric-pill"
              style={{
                background: `${MOOD_COLORS[todayCI.mood]}22`,
                color: MOOD_COLORS[todayCI.mood],
              }}
            >
              <span className="mood-dot" style={{ background: MOOD_COLORS[todayCI.mood] }} />
              {MOOD_CONFIG[todayCI.mood].label}
            </span>
            <span
              className="metric-pill"
              style={{
                background: `${ENERGY_CONFIG[todayCI.energy].color}22`,
                color: ENERGY_CONFIG[todayCI.energy].color,
              }}
            >
              {ENERGY_CONFIG[todayCI.energy].symbol} {ENERGY_CONFIG[todayCI.energy].label}
            </span>
            {todayCI.tags.map(t => (
              <span key={t} className="history-tag">{t}</span>
            ))}
          </div>
        ) : (
          <div className="stamp-hint unrecorded">
            <span>Tip: Log today's check-in to auto-stamp mood and tags to this entry.</span>
          </div>
        )}

        <button
          id="save-journal-btn"
          type="button"
          className="btn btn-primary btn-full"
          style={{ marginTop: '14px' }}
          disabled={!text.trim()}
          onClick={handleSave}
        >
          <PenLine size={18} /> Save entry
        </button>

        {savedNotice && (
          <p className="journal-saved-alert fade-in">
            ✨ Saved to your private sanctuary journal!
          </p>
        )}
      </div>

      {/* Archive & Search */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="sect-head">
          <div>
            <h3>Past reflections</h3>
            <p className="text-cap">
              {filtered.length} {filtered.length === 1 ? 'reflection' : 'reflections'}
            </p>
          </div>
        </div>

        {/* Live Search */}
        <div className="search-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="journal-search"
            className="search-input"
            placeholder="Search text, prompt, tag (e.g. sleep), or mood (e.g. low)…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="filter-row">
          {(['all', '7d', 1, 2, 3, 4, 5] as FilterMode[]).map(f => {
            const label =
              f === 'all'
                ? 'All'
                : f === '7d'
                ? 'Last 7 days'
                : `${MOOD_CONFIG[f as MoodLevel].emoji} ${MOOD_CONFIG[f as MoodLevel].label}`;
            return (
              <button
                key={String(f)}
                type="button"
                className={`tag-chip ${filter === f ? 'active' : ''}`}
                onClick={() => {
                  sound.playTap();
                  setFilter(f);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={36} className="empty-state-icon" />
            <p>
              {state.entries.length === 0
                ? 'No entries yet. Pick a prompt and write one line.'
                : 'No reflections match your search or filter.'}
            </p>
          </div>
        ) : (
          <div className="entries-list">
            {filtered.map(entry => (
              <article key={entry.id} className="entry-card">
                <div className="entry-header">
                  <div className="entry-meta">
                    <span className="entry-date">
                      <Calendar size={13} /> {entry.date}
                    </span>
                    {entry.mood && (
                      <span
                        className="entry-mood-badge"
                        style={{
                          background: `${MOOD_COLORS[entry.mood as MoodLevel]}22`,
                          color: MOOD_COLORS[entry.mood as MoodLevel],
                          border: `1px solid ${MOOD_COLORS[entry.mood as MoodLevel]}44`,
                        }}
                      >
                        <span
                          className="mood-dot"
                          style={{ background: MOOD_COLORS[entry.mood as MoodLevel] }}
                        />
                        {MOOD_CONFIG[entry.mood as MoodLevel]?.label}
                      </span>
                    )}
                    {entry.energy && (
                      <span
                        className="entry-mood-badge"
                        style={{
                          background: `${ENERGY_CONFIG[entry.energy as EnergyLevel]?.color}22`,
                          color: ENERGY_CONFIG[entry.energy as EnergyLevel]?.color,
                        }}
                      >
                        {ENERGY_CONFIG[entry.energy as EnergyLevel]?.symbol}{' '}
                        {ENERGY_CONFIG[entry.energy as EnergyLevel]?.label}
                      </span>
                    )}
                  </div>
                  <div className="entry-actions">
                    <button
                      type="button"
                      className="icon-btn"
                      title="Edit entry"
                      aria-label="Edit entry"
                      onClick={() => handleStartEdit(entry)}
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      title="Delete entry"
                      aria-label="Delete entry"
                      onClick={() => {
                        sound.playTap();
                        if (window.confirm('Delete this reflection?')) {
                          onDelete(entry.id);
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {entry.prompt && (
                  <p className="entry-prompt-q">"{entry.prompt}"</p>
                )}

                {editingId === entry.id ? (
                  <div className="entry-edit-box">
                    <textarea
                      className="textarea"
                      rows={4}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                    />
                    <div className="edit-buttons-row">
                      <button
                        type="button"
                        className="btn btn-primary btn-xs"
                        onClick={() => handleSaveEdit(entry)}
                      >
                        <Check size={13} /> Save changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={handleCancelEdit}
                      >
                        <X size={13} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="entry-body">{entry.text}</p>
                )}

                {entry.tags.length > 0 && (
                  <div className="entry-tags">
                    {entry.tags.map(t => (
                      <span key={t} className="entry-tag-pip">
                        <Tag size={10} /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
