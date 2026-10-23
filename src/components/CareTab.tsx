import React, { useState, useEffect, useRef } from 'react';
import {
  Heart, Play, Square, RotateCcw, CheckCircle2,
  Eye, Hand, Ear, Wind, Coffee, Phone, AlertCircle, Sparkles
} from 'lucide-react';
import { State } from '../types';
import { getRecommendedSuggestions, checkEscalation } from '../constants';
import { sound } from '../utils/audio';

interface Props {
  state: State;
  onToggleAction: (key: string, date: string) => void;
}

type BreathPhase = 'inhale' | 'hold-in' | 'exhale';

interface PhaseConfig {
  name: string;
  hint: string;
  duration: number; // in seconds
  scale: number;
  next: BreathPhase;
}

const PHASES: Record<BreathPhase, PhaseConfig> = {
  'inhale':  { name: 'Breathe in',  hint: 'Slowly through the nose…', duration: 4, scale: 1.9, next: 'hold-in' },
  'hold-in': { name: 'Hold',        hint: 'Gently hold…',             duration: 2, scale: 1.9, next: 'exhale' },
  'exhale':  { name: 'Breathe out', hint: 'Slowly through mouth…',    duration: 8, scale: 1.0, next: 'inhale' },
};

export const CareTab: React.FC<Props> = ({ state, onToggleAction }) => {
  const today = new Date().toISOString().split('T')[0];
  const sevenAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  const escalated    = checkEscalation(state.checkIns);
  const suggestions  = getRecommendedSuggestions(state.checkIns);
  const doneThisWeek = state.actions.filter(a => a.done && a.date >= sevenAgo).length;

  const isActionDone = (key: string) =>
    state.actions.some(a => a.date === today && a.suggestionKey === key && a.done);

  // Breathing timer state (4s Inhale -> 2s Hold -> 8s Exhale)
  const [breathActive, setBreathActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSecsLeft, setPhaseSecsLeft] = useState(PHASES['inhale'].duration);
  const [cycles, setCycles] = useState(0);
  const [currentScale, setCurrentScale] = useState(1.0);
  const breathTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!breathActive) {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
      return;
    }

    breathTimerRef.current = window.setInterval(() => {
      setPhaseSecsLeft(prev => {
        if (prev > 1) {
          return prev - 1;
        }

        // Advance to next phase
        setPhase(cur => {
          const next = PHASES[cur].next;
          setPhaseSecsLeft(PHASES[next].duration);
          setCurrentScale(PHASES[next].scale);

          // Soft chime on phase change
          if (next === 'inhale') {
            sound.playChime(440, 1.8);
            setCycles(c => c + 1);
          } else if (next === 'hold-in') {
            sound.playChime(528, 1.2);
          } else if (next === 'exhale') {
            sound.playChime(396, 2.4);
          }

          return next;
        });

        return PHASES[phase].duration;
      });
    }, 1000);

    return () => {
      if (breathTimerRef.current) clearInterval(breathTimerRef.current);
    };
  }, [breathActive, phase]);

  const handleStartStopBreath = () => {
    sound.playTap();
    if (!breathActive) {
      setPhase('inhale');
      setPhaseSecsLeft(PHASES['inhale'].duration);
      setCurrentScale(PHASES['inhale'].scale);
      sound.playChime(440, 1.8);
      setBreathActive(true);
    } else {
      setBreathActive(false);
      setCurrentScale(1.0);
    }
  };

  const handleResetBreath = () => {
    sound.playTap();
    setBreathActive(false);
    setPhase('inhale');
    setPhaseSecsLeft(PHASES['inhale'].duration);
    setCurrentScale(1.0);
    setCycles(0);
  };

  // 5-4-3-2-1 Grounding interactive list
  const [groundChecks, setGroundChecks] = useState<Record<string, boolean>>({});
  const toggleGround = (id: string) => {
    sound.playTap();
    setGroundChecks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="tab-pane">
      <div className="tab-header-block">
        <div className="sect-badge">
          <Heart size={13} /> Gentle Care
        </div>
        <h2>Nurturing space</h2>
        <p className="text-cap">Responsive suggestions and grounding rituals.</p>
      </div>

      {/* Escalation banner if 3+ heavy days */}
      {escalated && (
        <div className="escalation-banner" role="alert">
          <div className="escalation-title">
            <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px' }} />
            You have had a few heavy days.
          </div>
          <div className="escalation-sub">
            You do not have to carry this alone. Please reach out to someone you trust or one of the free support lines below.
          </div>
          <SupportResourcesList expanded />
        </div>
      )}

      {/* Weekly small actions count badge */}
      <div className="done-count-strip">
        <CheckCircle2 size={16} />
        <span>
          <strong>{doneThisWeek}</strong> small {doneThisWeek === 1 ? 'action' : 'actions'} done this week
        </span>
      </div>

      {/* Personalised Suggestions Card */}
      <div className="card">
        <div className="sect-head">
          <div>
            <h3>Suggestions for you</h3>
            <p className="text-cap">Grounded in your recent check-in, energy and tags</p>
          </div>
          <Sparkles size={16} style={{ color: 'var(--sage-deep)' }} />
        </div>

        <div className="suggestions-stack">
          {suggestions.length === 0 ? (
            <p style={{ color: 'var(--ink-soft)', fontSize: '14px', padding: '12px 0' }}>
              Log a check-in to receive tailored recommendations.
            </p>
          ) : (
            suggestions.map(s => {
              const done = isActionDone(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  id={`sugg-${s.key}`}
                  className={`sugg-card ${done ? 'done' : ''}`}
                  onClick={() => {
                    sound.playTap();
                    onToggleAction(s.key, today);
                  }}
                  aria-pressed={done}
                >
                  <div className={`sugg-check ${done ? 'checked' : ''}`}>
                    {done ? <CheckCircle2 size={16} /> : <div className="sugg-check-dot" />}
                  </div>
                  <div className="sugg-content">
                    <div className="sugg-title">{s.title}</div>
                    <div className="sugg-why">{s.why}</div>
                    {s.targetTag && (
                      <span className="sugg-tag-badge">{s.targetTag}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 4-2-8 Breathing Exercise */}
      <div className="card">
        <div className="sect-head">
          <div>
            <h3>4-2-8 Reset breathing</h3>
            <p className="text-cap">4s Inhale · 2s Hold · 8s Exhale — follow the circle</p>
          </div>
          <Wind size={16} style={{ color: 'var(--lavender-deep)' }} />
        </div>

        <div className="breathing-wrap">
          <div className="breathing-stage">
            {/* Outer static guideline ring */}
            <div className="breathing-guide-ring" />

            {/* Spec: circle scales 1 -> 1.9 over 4 s (inhale), holds 2 s, shrinks over 8 s (exhale), looping */}
            <div
              className={`breathing-circle ${breathActive ? 'active' : ''} phase-${phase}`}
              style={{
                transform: `scale(${currentScale})`,
                transition: breathActive
                  ? phase === 'inhale'
                    ? `transform ${PHASES['inhale'].duration}s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.8s`
                    : phase === 'exhale'
                    ? `transform ${PHASES['exhale'].duration}s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.8s`
                    : 'transform 0.4s ease, background-color 0.5s'
                  : 'transform 0.5s ease',
              }}
            />

            {/* In-circle phase text */}
            <div className="breath-phase-text" aria-live="polite">
              <div className="phase-name">
                {breathActive ? PHASES[phase].name : 'Ready to breathe'}
              </div>
              <div className="phase-countdown">
                {breathActive ? phaseSecsLeft : '4-2-8'}
              </div>
              <div className="phase-hint">
                {breathActive ? PHASES[phase].hint : 'Press Start to begin'}
              </div>
            </div>
          </div>

          <div className="breathing-controls">
            <button
              id="breathing-start-btn"
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleStartStopBreath}
            >
              {breathActive ? <Square size={14} /> : <Play size={14} />}
              {breathActive ? 'Stop' : 'Start'}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResetBreath}
            >
              <RotateCcw size={14} /> Reset
            </button>
            {cycles > 0 && (
              <span className="cycles-badge">
                ✨ {cycles} {cycles === 1 ? 'cycle' : 'cycles'} completed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5-4-3-2-1 Grounding Ritual */}
      <div className="card">
        <div className="sect-head">
          <div>
            <h3>5-4-3-2-1 Sensory grounding</h3>
            <p className="text-cap">Anchor yourself in this physical moment.</p>
          </div>
        </div>
        <div className="grounding-list">
          {[
            { id: 'g5', n: 5, icon: <Eye size={16} />, text: 'Acknowledge 5 things you can see right now.' },
            { id: 'g4', n: 4, icon: <Hand size={16} />, text: 'Notice 4 physical textures you can touch.' },
            { id: 'g3', n: 3, icon: <Ear size={16} />, text: 'Listen for 3 distinct sounds around you.' },
            { id: 'g2', n: 2, icon: <Wind size={16} />, text: 'Notice 2 scents, or take 2 slow deep breaths.' },
            { id: 'g1', n: 1, icon: <Coffee size={16} />, text: 'Notice 1 taste, or take a gentle sip of water.' },
          ].map(step => (
            <button
              key={step.id}
              type="button"
              id={`grounding-step-${step.n}`}
              className={`grounding-item ${groundChecks[step.id] ? 'done' : ''}`}
              onClick={() => toggleGround(step.id)}
              aria-pressed={Boolean(groundChecks[step.id])}
            >
              <div className="grounding-num">{step.n}</div>
              <span className="grounding-icon-wrap">{step.icon}</span>
              <span className="grounding-text">{step.text}</span>
              {groundChecks[step.id] && (
                <CheckCircle2 size={18} className="grounding-check" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Support Resources (Always visible) */}
      {!escalated && (
        <div className="card">
          <div className="sect-head">
            <div>
              <h3>Support resources</h3>
              <p className="text-cap">Free, confidential helplines whenever you need an ear.</p>
            </div>
            <Phone size={16} style={{ color: 'var(--sage-deep)' }} />
          </div>
          <SupportResourcesList expanded={false} />
        </div>
      )}

      {/* Disclaimer */}
      <p className="disclaimer-note">
        Wellness Pulse is a reflection tool, not medical advice or a diagnosis.
      </p>
    </div>
  );
};

const SupportResourcesList: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <div className="resources-wrapper">
    <div className="resources-grid">
      {[
        {
          name: 'Tele-MANAS',
          desc: 'India · Free · 24×7 Government Helpline',
          number: '14416',
          tel: '14416',
          accent: 'var(--sage-deep)',
        },
        {
          name: 'iCall Helpline',
          desc: 'Free psychosocial counselling by TISS',
          number: '+91 91529 87821',
          tel: '+919152987821',
          accent: 'var(--lavender-deep)',
        },
        {
          name: 'Emergency Services',
          desc: 'Immediate nationwide emergency support',
          number: '112',
          tel: '112',
          accent: 'var(--sage-deep)',
        },
      ].map(r => (
        <div key={r.name} className="resource-card">
          <div className="resource-info">
            <div className="resource-name">{r.name}</div>
            <div className="resource-desc">{r.desc}</div>
            <div className="resource-number">{r.number}</div>
          </div>
          <a
            href={`tel:${r.tel}`}
            className="resource-call-btn"
            aria-label={`Call ${r.name} at ${r.number}`}
          >
            <Phone size={14} /> Call
          </a>
        </div>
      ))}
    </div>
    {!expanded && (
      <p className="resources-footer-note">
        All lines are free, confidential, and available to anyone who needs a listening ear.
      </p>
    )}
  </div>
);
