import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Trash2, Clock, ArrowRight, Sparkles, Phone, AlertCircle
} from 'lucide-react';
import { CheckIn, MoodLevel, EnergyLevel, State } from '../types';
import {
  MOOD_CONFIG, MOOD_COLORS, ENERGY_CONFIG, DEFAULT_TAGS,
  checkEscalation, getRecommendedSuggestions, getMoodPrompts
} from '../constants';
import { PulseOrb } from './PulseOrb';
import { sound } from '../utils/audio';

interface Props {
  state: State;
  onSave:   (data: Omit<CheckIn,'id'|'ts'>) => void;
  onDelete: (id: string) => void;
  onGoJournal: (prompt: string) => void;
  pulseTrigger: number;
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning. How are you, really?';
  if (h < 17) return 'Good afternoon. How are you, really?';
  return 'Good evening. How did today treat you?';
};

export const CheckInTab: React.FC<Props> = ({
  state,
  onSave,
  onDelete,
  onGoJournal,
  pulseTrigger: externalPulseTrigger,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = state.checkIns.find(c => c.date === today);

  const [mood,   setMood]   = useState<MoodLevel>(existing?.mood   ?? 3);
  const [energy, setEnergy] = useState<EnergyLevel>(existing?.energy ?? 3);
  const [tags,   setTags]   = useState<string[]>(existing?.tags ?? []);
  const [localPulse, setLocalPulse] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (existing) {
      setMood(existing.mood);
      setEnergy(existing.energy);
      setTags(existing.tags);
    }
  }, [existing]);

  // Combined pulse trigger from parent or local save
  const effectivePulse = externalPulseTrigger + localPulse;

  const escalated = checkEscalation(state.checkIns);

  // Suggestions respond live to current mood, energy, and selected tags before/after saving
  const currentPreviewCheckIns: CheckIn[] = [
    { id: 'preview', date: today, mood, energy, tags, ts: Date.now() },
    ...state.checkIns.filter(c => c.date !== today),
  ];
  const suggestions = getRecommendedSuggestions(currentPreviewCheckIns);
  const topSuggestion = suggestions[0];

  const matchingPrompt = getMoodPrompts(mood)[0];

  const toggleTag = (t: string) => {
    sound.playTap();
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSelectMood = (lvl: MoodLevel) => {
    sound.playTap();
    setMood(lvl);
  };

  const handleEnergyChange = (val: EnergyLevel) => {
    setEnergy(val);
  };

  const handleSave = () => {
    sound.playSuccess();
    onSave({ date: today, mood, energy, tags });
    setLocalPulse(n => n + 1);
    setJustSaved(true);
  };

  const energyColor = ENERGY_CONFIG[energy].color;

  return (
    <div className="tab-pane">

      {/* Escalation banner for heavy days */}
      {escalated && (
        <div className="escalation-banner" role="alert">
          <div className="escalation-title">
            <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px' }} />
            You have had a few heavy days.
          </div>
          <div className="escalation-sub">
            You do not have to carry this alone. Support is free, confidential, and available right now.
          </div>
          <div className="escalation-contacts">
            <a href="tel:14416" className="resource-call-btn">
              <Phone size={13} /> Tele-MANAS (14416)
            </a>
            <a href="tel:+919152987821" className="resource-call-btn">
              <Phone size={13} /> iCall (+91 9152987821)
            </a>
            <a href="tel:112" className="resource-call-btn">
              <Phone size={13} /> Emergency 112
            </a>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div className="checkin-hero">
        <h1 className="hero-greeting">{getGreeting()}</h1>
        <p className="text-cap">Two quick taps. A calm, private pause just for you.</p>
      </div>

      {/* Pulse Orb signature element */}
      <PulseOrb mood={mood} energy={energy} pulseTrigger={effectivePulse} />

      {/* Mood selector */}
      <div className="card">
        <div className="card-header-clean">
          <h3>How are you feeling?</h3>
          <p className="text-cap">Select your mood right now.</p>
        </div>
        <div
          className="mood-grid"
          role="radiogroup"
          aria-label="Mood level"
        >
          {([1, 2, 3, 4, 5] as MoodLevel[]).map(lvl => {
            const cfg = MOOD_CONFIG[lvl];
            const sel = mood === lvl;
            return (
              <button
                key={lvl}
                id={`mood-option-${lvl}`}
                type="button"
                role="radio"
                aria-checked={sel}
                className={`mood-opt ${sel ? 'selected' : ''}`}
                style={sel ? {
                  borderColor: MOOD_COLORS[lvl],
                  backgroundColor: `${MOOD_COLORS[lvl]}20`,
                  boxShadow: `0 8px 24px ${MOOD_COLORS[lvl]}33`,
                } : {}}
                onClick={() => handleSelectMood(lvl)}
              >
                <span className="mood-icon">{cfg.emoji}</span>
                <span className="mood-lbl">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy slider */}
      <div className="card">
        <div className="card-header-clean">
          <h3>Energy level</h3>
          <p className="text-cap">Drained to buzzing — drag to reflect your energy.</p>
        </div>
        <div className="energy-slider-wrap">
          <input
            type="range"
            id="energy-slider"
            min={1} max={5} step={1}
            value={energy}
            onChange={e => handleEnergyChange(Number(e.target.value) as EnergyLevel)}
            aria-label="Energy level"
            style={{ accentColor: energyColor }}
          />
          <div className="slider-labels">
            {([1, 2, 3, 4, 5] as EnergyLevel[]).map(lvl => (
              <span
                key={lvl}
                className={`slider-label-tick ${energy === lvl ? 'active' : ''}`}
                style={{ color: energy === lvl ? 'var(--ink)' : 'var(--ink-soft)' }}
              >
                {ENERGY_CONFIG[lvl].label}
              </span>
            ))}
          </div>
          <div
            className="slider-current-badge"
            style={{ borderColor: energyColor, color: energyColor }}
          >
            <span>{ENERGY_CONFIG[energy].symbol}</span>
            <span>{ENERGY_CONFIG[energy].label}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <div className="card-header-clean">
          <h3>What's on your mind?</h3>
          <p className="text-cap">Optional tags to help uncover subtle patterns.</p>
        </div>
        <div className="tag-cloud">
          {DEFAULT_TAGS.map(tag => {
            const isSelected = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                id={`tag-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                className={`tag-chip ${isSelected ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
                aria-pressed={isSelected}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save check-in button */}
      <button
        id="save-checkin-btn"
        type="button"
        className="btn btn-primary btn-full btn-large"
        onClick={handleSave}
      >
        <CheckCircle2 size={20} />
        {existing ? 'Update check-in' : 'Save check-in'}
      </button>

      {/* Confirmation text */}
      {existing && (
        <p className="confirmation-line">
          Recorded for today ({existing.date}). Saving again updates today's pulse.
        </p>
      )}

      {/* Next small step card after saving */}
      {justSaved && topSuggestion && (
        <div className="next-step-card fade-in">
          <div className="next-step-badge">
            <Sparkles size={13} /> Next small step
          </div>
          <div className="next-step-title">{topSuggestion.title}</div>
          <div className="next-step-why">{topSuggestion.why}</div>
          <div className="next-step-actions">
            <button
              type="button"
              id="write-about-it-btn"
              className="btn btn-primary btn-sm"
              onClick={() => onGoJournal(matchingPrompt)}
            >
              <ArrowRight size={15} /> Write about it
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setJustSaved(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* History log */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="sect-head">
          <div>
            <h3>Recent check-ins</h3>
            <p className="text-cap">{state.checkIns.length} recorded in total</p>
          </div>
          <Clock size={16} style={{ color: 'var(--ink-soft)' }} />
        </div>

        {state.checkIns.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <p>No check-ins yet. Take your first 30-second check-in above.</p>
          </div>
        ) : (
          <div className="history-list">
            {state.checkIns
              .slice()
              .sort((a, b) => b.date.localeCompare(a.date))
              .slice(0, 7)
              .map(ci => (
                <div key={ci.id} className="history-row">
                  <div className="history-date-wrap">
                    <span className="history-date-str">{ci.date}</span>
                    {ci.date === today && <span className="today-chip">Today</span>}
                  </div>
                  <div className="history-metrics">
                    <span
                      className="metric-pill"
                      style={{
                        background: `${MOOD_COLORS[ci.mood]}22`,
                        color: MOOD_COLORS[ci.mood],
                        borderColor: `${MOOD_COLORS[ci.mood]}44`,
                      }}
                    >
                      {MOOD_CONFIG[ci.mood].emoji} {MOOD_CONFIG[ci.mood].label}
                    </span>
                    <span
                      className="metric-pill"
                      style={{
                        background: `${ENERGY_CONFIG[ci.energy].color}22`,
                        color: ENERGY_CONFIG[ci.energy].color,
                        borderColor: `${ENERGY_CONFIG[ci.energy].color}44`,
                      }}
                    >
                      {ENERGY_CONFIG[ci.energy].symbol} {ENERGY_CONFIG[ci.energy].label}
                    </span>
                  </div>
                  <div className="history-tags-list">
                    {ci.tags.map(t => (
                      <span key={t} className="history-tag">{t}</span>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="history-del icon-btn"
                    title="Delete check-in"
                    aria-label={`Delete check-in from ${ci.date}`}
                    onClick={() => {
                      if (window.confirm(`Delete check-in for ${ci.date}?`)) {
                        onDelete(ci.id);
                      }
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
