import React, { useState, useMemo, useRef, useEffect } from 'react';
import { TrendingUp, BarChart3, Sparkles, RefreshCw, Trash2, Calendar } from 'lucide-react';
import { CheckIn, MoodLevel, State } from '../types';
import {
  MOOD_COLORS, MOOD_CONFIG, ENERGY_CONFIG,
  calculateStreak, computeAvg, generateInsightSentences
} from '../constants';
import { sound } from '../utils/audio';

interface Props {
  state:          State;
  onLoadSample:   () => void;
  onClearAll:     () => void;
}

type Tf = '7d' | '14d' | '30d';

const DAYS_FOR_TF: Record<Tf, number> = { '7d': 7, '14d': 14, '30d': 30 };

export const InsightsTab: React.FC<Props> = ({ state, onLoadSample, onClearAll }) => {
  const [tf, setTf] = useState<Tf>('14d');
  const [tooltip, setTooltip] = useState<{ ci: CheckIn; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [chartKey, setChartKey] = useState(0);

  const { checkIns, entries, actions } = state;

  // Trigger draw-in animation whenever timeframe changes
  useEffect(() => {
    setChartKey(k => k + 1);
  }, [tf, checkIns.length]);

  // Filter by timeframe
  const filtered = useMemo(() => {
    const days = DAYS_FOR_TF[tf];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return checkIns
      .filter(c => c.date >= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [checkIns, tf]);

  // Stats
  const streak    = useMemo(() => calculateStreak(checkIns), [checkIns]);
  const avgMood   = useMemo(() => computeAvg(filtered, 'mood'),   [filtered]);
  const avgEnergy = useMemo(() => computeAvg(filtered, 'energy'), [filtered]);
  const doneCount = useMemo(() =>
    actions.filter(a => a.done && (() => {
      const d = new Date(); d.setDate(d.getDate() - 7); return a.date >= d.toISOString().split('T')[0];
    })()).length,
  [actions]);

  // Insights
  const insights = useMemo(() => generateInsightSentences(checkIns, entries), [checkIns, entries]);

  // Chart dimensions
  const W = 620, H = 230;
  const PAD = { top: 30, right: 28, bottom: 40, left: 42 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top  - PAD.bottom;

  // Date range mapping to handle missing days accurately
  const totalDays = DAYS_FOR_TF[tf];

  const pts = useMemo(() => {
    if (filtered.length === 0) return [];

    // Map each day in the timeframe to an x position
    const now = new Date();
    const result: { ci: CheckIn; x: number; yM: number; yE: number; dayIndex: number }[] = [];

    filtered.forEach((ci) => {
      const d = new Date(ci.date + 'T12:00:00');
      const diffDays = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
      const normalizedDay = Math.max(0, Math.min(totalDays - 1, totalDays - 1 - diffDays));

      const x = filtered.length === 1
        ? PAD.left + iW / 2
        : PAD.left + (normalizedDay / (totalDays - 1)) * iW;

      const yM = PAD.top + iH - ((ci.mood   - 1) / 4) * iH;
      const yE = PAD.top + iH - ((ci.energy - 1) / 4) * iH;

      result.push({ ci, x, yM, yE, dayIndex: normalizedDay });
    });

    return result;
  }, [filtered, iW, iH, totalDays]);

  // Smooth spline path generator with gap tolerance (break path if gap > 2 days)
  const toSegmentedPaths = (coords: { x: number; y: number; ci: CheckIn }[]) => {
    if (!coords.length) return [];
    const segments: { x: number; y: number }[][] = [];
    let currentSeg: { x: number; y: number }[] = [coords[0]];

    for (let i = 1; i < coords.length; i++) {
      const prevDate = new Date(coords[i - 1].ci.date).getTime();
      const curDate = new Date(coords[i].ci.date).getTime();
      const diffDays = (curDate - prevDate) / (1000 * 3600 * 24);

      if (diffDays <= 2) {
        currentSeg.push(coords[i]);
      } else {
        segments.push(currentSeg);
        currentSeg = [coords[i]];
      }
    }
    if (currentSeg.length) segments.push(currentSeg);

    return segments.map(seg => {
      if (seg.length === 1) return `M ${seg[0].x},${seg[0].y} l 0.1,0`;
      return seg.reduce((acc, p, i) => {
        if (i === 0) return `M ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        const prev = seg[i - 1];
        const cx = (prev.x + p.x) / 2;
        return `${acc} C ${cx.toFixed(1)},${prev.y.toFixed(1)} ${cx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      }, '');
    });
  };

  const moodSegments   = useMemo(() => toSegmentedPaths(pts.map(p => ({ x: p.x, y: p.yM, ci: p.ci }))), [pts]);
  const energySegments = useMemo(() => toSegmentedPaths(pts.map(p => ({ x: p.x, y: p.yE, ci: p.ci }))), [pts]);

  // Calendar heat strip (last 30 days)
  const heatDays = useMemo(() => {
    const days: { date: string; mood?: MoodLevel; dayNum: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const ci = checkIns.find(c => c.date === date);
      days.push({ date, mood: ci?.mood, dayNum: d.getDate() });
    }
    return days;
  }, [checkIns]);

  const hasEnough = checkIns.length >= 3;

  return (
    <div className="tab-pane">
      <div className="tab-header-block">
        <div className="sect-badge">
          <TrendingUp size={13} /> Patterns
        </div>
        <h2>Wellbeing trends</h2>
        <p className="text-cap">Clear visual insights without clinical judgment.</p>
      </div>

      {/* Timeframe toggle */}
      <div className="timeframe-row">
        {(['7d', '14d', '30d'] as Tf[]).map(t => (
          <button
            key={t}
            type="button"
            className={`tf-btn ${tf === t ? 'active' : ''}`}
            onClick={() => {
              sound.playTap();
              setTf(t);
            }}
          >
            {t === '7d' ? '7 days' : t === '14d' ? '14 days' : '30 days'}
          </button>
        ))}
      </div>

      {/* Summary Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Average mood</div>
          <div
            className="stat-num"
            style={{
              color: avgMood ? MOOD_COLORS[Math.round(avgMood) as MoodLevel] : 'var(--ink)'
            }}
          >
            {avgMood || '—'}
          </div>
          <div className="stat-sub">Scale 1 to 5</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average energy</div>
          <div className="stat-num" style={{ color: 'var(--sage-deep)' }}>
            {avgEnergy || '—'}
          </div>
          <div className="stat-sub">Scale 1 to 5</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Current streak</div>
          <div className="stat-num">{streak}</div>
          <div className="stat-sub">{streak === 1 ? 'day' : 'days'} in a row</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Journal entries</div>
          <div className="stat-num">{entries.length}</div>
          <div className="stat-sub">{doneCount} actions done this week</div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="card chart-wrap">
        <div className="sect-head">
          <div>
            <h3>Mood &amp; energy timeline</h3>
            <p className="text-cap">Lavender = mood · Sage = energy</p>
          </div>
          <div className="chart-legend">
            <span className="legend-item">
              <span className="legend-line" style={{ background: 'var(--lavender)' }} />
              Mood
            </span>
            <span className="legend-item">
              <span className="legend-line" style={{ background: 'var(--sage)' }} />
              Energy
            </span>
          </div>
        </div>

        {/* Text summary for Screen Readers (WCAG requirement) */}
        <p className="sr-only" aria-label="Visual trend summary">
          Line chart representing your mood and energy over the last {DAYS_FOR_TF[tf]} days.
          Average recorded mood is {avgMood || 'none'} and average energy is {avgEnergy || 'none'}.
        </p>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <BarChart3 size={36} className="empty-state-icon" />
            <p>No check-ins recorded during this timeframe.</p>
          </div>
        ) : (
          <div className="chart-container" style={{ position: 'relative' }}>
            <svg
              key={chartKey}
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              className="chart-svg"
            >
              <defs>
                <linearGradient id="mood-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--lavender)" />
                  <stop offset="100%" stopColor="var(--lavender-deep)" />
                </linearGradient>
                <linearGradient id="energy-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--sage)" />
                  <stop offset="100%" stopColor="var(--sage-deep)" />
                </linearGradient>
              </defs>

              {/* Grid lines and Y-axis labels */}
              {[1, 2, 3, 4, 5].map(lvl => {
                const y = PAD.top + iH - ((lvl - 1) / 4) * iH;
                return (
                  <g key={lvl}>
                    <line
                      x1={PAD.left}
                      y1={y}
                      x2={W - PAD.right}
                      y2={y}
                      stroke="var(--line)"
                      strokeWidth={lvl === 3 ? 1.4 : 0.75}
                      strokeDasharray={lvl === 3 ? '4,4' : '2,4'}
                      opacity={0.8}
                    />
                    <text
                      x={PAD.left - 10}
                      y={y + 4}
                      fontSize="11"
                      fill="var(--ink-soft)"
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* X-axis date labels */}
              {pts.map((p, i) => {
                const showLabel =
                  pts.length <= 7 ||
                  i === 0 ||
                  i === pts.length - 1 ||
                  i % Math.ceil(pts.length / 5) === 0;

                if (!showLabel) return null;
                return (
                  <text
                    key={`label-${p.ci.id}`}
                    x={p.x}
                    y={H - 10}
                    fontSize="10"
                    fill="var(--ink-soft)"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {p.ci.date.slice(5)}
                  </text>
                );
              })}

              {/* Journal day markers at top of chart */}
              {pts.map(p => {
                const hasEntry = entries.some(e => e.date === p.ci.date);
                if (!hasEntry) return null;
                return (
                  <g key={`journal-mark-${p.ci.id}`}>
                    <circle
                      cx={p.x}
                      cy={PAD.top - 10}
                      r={3.5}
                      fill="var(--lavender-deep)"
                      opacity={0.85}
                    />
                    <title>Reflection written on {p.ci.date}</title>
                  </g>
                );
              })}

              {/* Energy segmented paths (drawn in left to right ~1.2s) */}
              {energySegments.map((seg, idx) => (
                <path
                  key={`energy-seg-${idx}`}
                  d={seg}
                  fill="none"
                  stroke="url(#energy-line-grad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="chart-draw-in-energy"
                />
              ))}

              {/* Mood segmented paths (drawn in left to right ~1.2s) */}
              {moodSegments.map((seg, idx) => (
                <path
                  key={`mood-seg-${idx}`}
                  d={seg}
                  fill="none"
                  stroke="url(#mood-line-grad)"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  className="chart-draw-in-mood"
                />
              ))}

              {/* Data dots on check-in days */}
              {pts.map(p => (
                <g key={`dots-${p.ci.id}`}>
                  {/* Energy dot */}
                  <circle
                    cx={p.x}
                    cy={p.yE}
                    r={5}
                    fill="var(--sage)"
                    stroke="var(--cream-2)"
                    strokeWidth="2"
                    className="chart-dot"
                    tabIndex={0}
                    role="button"
                    aria-label={`${p.ci.date}: Energy ${p.ci.energy}`}
                    onMouseEnter={() =>
                      setTooltip({ ci: p.ci, x: (p.x / W) * 100, y: (p.yE / H) * 100 })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() =>
                      setTooltip(prev => prev?.ci.id === p.ci.id ? null : { ci: p.ci, x: (p.x / W) * 100, y: (p.yE / H) * 100 })
                    }
                  />

                  {/* Mood dot */}
                  <circle
                    cx={p.x}
                    cy={p.yM}
                    r={5.5}
                    fill={MOOD_COLORS[p.ci.mood]}
                    stroke="var(--cream-2)"
                    strokeWidth="2"
                    className="chart-dot"
                    tabIndex={0}
                    role="button"
                    aria-label={`${p.ci.date}: Mood ${p.ci.mood}`}
                    onMouseEnter={() =>
                      setTooltip({ ci: p.ci, x: (p.x / W) * 100, y: (p.yM / H) * 100 })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    onClick={() =>
                      setTooltip(prev => prev?.ci.id === p.ci.id ? null : { ci: p.ci, x: (p.x / W) * 100, y: (p.yM / H) * 100 })
                    }
                  />
                </g>
              ))}
            </svg>

            {/* Interactive Tooltip */}
            {tooltip && (
              <div
                className="chart-tooltip fade-in"
                style={{
                  left: `${tooltip.x}%`,
                  top: tooltip.y > 60 ? '12%' : '52%',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="tooltip-date">
                  <Calendar size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {tooltip.ci.date}
                </div>
                <div className="tooltip-row">
                  <span className="mood-dot" style={{ background: MOOD_COLORS[tooltip.ci.mood] }} />
                  <span>Mood: <strong>{MOOD_CONFIG[tooltip.ci.mood].label} ({tooltip.ci.mood}/5)</strong></span>
                </div>
                <div className="tooltip-row">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--sage)',
                      display: 'inline-block',
                    }}
                  />
                  <span>Energy: <strong>{ENERGY_CONFIG[tooltip.ci.energy].label} ({tooltip.ci.energy}/5)</strong></span>
                </div>
                {tooltip.ci.tags.length > 0 && (
                  <div className="tooltip-row tooltip-tags">
                    {tooltip.ci.tags.map(t => (
                      <span key={t} className="history-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar heat strip (last 30 days) */}
      <div className="card">
        <h3 style={{ marginBottom: '12px' }}>Last 30 days calendar strip</h3>
        <div className="heat-strip" role="list" aria-label="30 day mood calendar strip">
          {heatDays.map(day => (
            <div
              key={day.date}
              role="listitem"
              className={`heat-day ${day.mood ? 'has-mood' : ''}`}
              title={day.mood ? `${day.date}: ${MOOD_CONFIG[day.mood].label} (${day.mood}/5)` : day.date}
              style={{
                background: day.mood ? MOOD_COLORS[day.mood] : 'var(--line)',
              }}
            >
              <span className="heat-day-label">{day.dayNum}</span>
            </div>
          ))}
        </div>
        <div className="heat-legend">
          <span>Low</span>
          <div className="heat-legend-dots">
            {([1, 2, 3, 4, 5] as MoodLevel[]).map(m => (
              <div
                key={m}
                className="heat-legend-dot"
                style={{ background: MOOD_COLORS[m] }}
                title={`${MOOD_CONFIG[m].label} (${m})`}
              />
            ))}
          </div>
          <span>Great</span>
        </div>
      </div>

      {/* Computed Plain-Language Insights */}
      <div className="card">
        <div className="sect-head">
          <div>
            <h3>What the data whispers</h3>
            <p className="text-cap">Honest patterns in simple, plain language.</p>
          </div>
          <Sparkles size={16} style={{ color: 'var(--lavender-deep)' }} />
        </div>

        {!hasEnough ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <p>Check in on 3 or more days to unlock pattern insights.</p>
            <div className="empty-state-actions">
              <button
                type="button"
                id="load-sample-week-btn"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  sound.playSuccess();
                  onLoadSample();
                }}
              >
                <RefreshCw size={14} /> Load sample week
              </button>
              {checkIns.length > 0 && (
                <button
                  type="button"
                  id="clear-insights-data-btn"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    sound.playTap();
                    if (window.confirm('Clear all recorded check-ins and reflections?')) {
                      onClearAll();
                    }
                  }}
                >
                  <Trash2 size={14} /> Clear all data
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="insight-list">
              {insights.map((sentence, idx) => (
                <div key={idx} className="insight-item">
                  {sentence}
                </div>
              ))}
              {insights.length === 0 && (
                <div className="insight-item">
                  Keep recording daily check-ins — deeper correlations emerge after a week.
                </div>
              )}
            </div>
            <div className="insights-bottom-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  sound.playTap();
                  if (window.confirm('Clear all data from this device?')) {
                    onClearAll();
                  }
                }}
              >
                <Trash2 size={14} /> Clear all data
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
