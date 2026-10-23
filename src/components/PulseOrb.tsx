import React, { useEffect, useRef, useState } from 'react';
import { MoodLevel, EnergyLevel } from '../types';
import { MOOD_COLORS, MOOD_CONFIG, ENERGY_CONFIG } from '../constants';
import { sound } from '../utils/audio';

interface PulseOrbProps {
  mood: MoodLevel;
  energy: EnergyLevel;
  pulseTrigger: number; // increment to trigger a single pulse
  size?: number; // optional custom size (default 240)
  interactive?: boolean;
}

// Convert control points to smooth closed cubic bezier SVG path
function getSplinePath(points: { x: number; y: number }[]): string {
  const n = points.length;
  if (n < 3) return '';

  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    // Catmull-Rom to Cubic Bezier conversion
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  path += ' Z';
  return path;
}

export const PulseOrb: React.FC<PulseOrbProps> = ({
  mood,
  energy,
  pulseTrigger,
  size = 240,
  interactive = true,
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTrigger = useRef(pulseTrigger);
  const pathRef = useRef<SVGPathElement | null>(null);
  const glowPathRef = useRef<SVGPathElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  const moodColor = MOOD_COLORS[mood];
  const moodCfg = MOOD_CONFIG[mood];
  const energyCfg = ENERGY_CONFIG[energy];

  // Base parameters dictated by spec:
  // Mood sets size and smoothness (1: low/jittery/smaller -> 5: great/smooth/larger)
  // Energy sets speed (1: slow/drained -> 5: buzzing/fast)
  const baseRadius = 56 + (mood - 1) * 8.5; // ~56px to ~90px
  const jitterAmount = (6 - mood) * 2.2; // 1: 11px jitter, 5: 2.2px smooth
  const speed = 0.012 + (energy - 1) * 0.009; // 1: 0.012, 5: 0.048

  // Continuous organic morphing on requestAnimationFrame
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const numPoints = 8;
    const cx = size / 2;
    const cy = size / 2;

    const render = () => {
      if (!prefersReduced) {
        timeRef.current += speed;
      }
      const t = timeRef.current;

      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Multiphase sine/cosine wave for organic liquid blob
        const w1 = Math.sin(t * 1.8 + i * 1.3) * jitterAmount;
        const w2 = Math.cos(t * 2.6 - i * 0.9) * (jitterAmount * 0.7);
        const w3 = Math.sin(t * 3.4 + i * 2.1) * (mood <= 2 ? 3.5 : 0.8); // slight nervous jitter for low mood
        const r = baseRadius + w1 + w2 + w3;

        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      }

      const pathStr = getSplinePath(points);
      if (pathRef.current) {
        pathRef.current.setAttribute('d', pathStr);
      }
      if (glowPathRef.current) {
        glowPathRef.current.setAttribute('d', pathStr);
      }

      if (!prefersReduced) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mood, energy, baseRadius, jitterAmount, speed, size]);

  // Single pulse when saveCheckIn triggers
  useEffect(() => {
    if (pulseTrigger !== prevTrigger.current) {
      prevTrigger.current = pulseTrigger;
      setIsPulsing(true);
      sound.playSuccess();
      const timer = setTimeout(() => setIsPulsing(false), 850);
      return () => clearTimeout(timer);
    }
  }, [pulseTrigger]);

  return (
    <div className={`orb-wrap ${interactive ? 'interactive' : ''}`} style={{ width: size, height: size }}>
      <div
        className={`orb-ring ${isPulsing ? 'pulse-spring' : ''}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          aria-hidden="true"
          className="orb-svg"
        >
          <defs>
            <radialGradient id={`orb-grad-${mood}`} cx="38%" cy="32%" r="68%">
              <stop offset="0%" stopColor={moodColor} stopOpacity="1" />
              <stop offset="65%" stopColor={moodColor} stopOpacity="0.88" />
              <stop offset="100%" stopColor={moodColor} stopOpacity="0.72" />
            </radialGradient>
            <radialGradient id={`orb-specular-${mood}`} cx="32%" cy="25%" r="45%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </radialGradient>
            <filter id="orb-glow-filter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="orb-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
              <feOffset dx="0" dy="8" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.15" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ambient Glow halo */}
          <path
            ref={glowPathRef}
            fill={moodColor}
            opacity="0.32"
            filter="url(#orb-glow-filter)"
            transform={`scale(1.08) translate(-${size * 0.04}, -${size * 0.04})`}
          />

          {/* Main Morphing Blob */}
          <path
            ref={pathRef}
            fill={`url(#orb-grad-${mood})`}
            filter="url(#orb-soft-shadow)"
          />

          {/* Inner Highlight / Specular Shimmer */}
          <circle
            cx={size * 0.42}
            cy={size * 0.38}
            r={baseRadius * 0.65}
            fill={`url(#orb-specular-${mood})`}
            pointerEvents="none"
          />
        </svg>

        {/* Pulse Ripple Wave on Save */}
        {isPulsing && (
          <div
            className="pulse-wave-ring"
            style={{
              borderColor: moodColor,
              boxShadow: `0 0 24px ${moodColor}66`,
            }}
          />
        )}

        {/* Centered Mood & Energy Label */}
        <div className="orb-inner-text" aria-live="polite">
          <div className="orb-mood-emoji">{moodCfg.emoji}</div>
          <div className="orb-mood-label">{moodCfg.label}</div>
          <div className="orb-energy-line">
            <span className="orb-energy-symbol">{energyCfg.symbol}</span>
            <span>{energyCfg.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
