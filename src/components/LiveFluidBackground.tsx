import React, { useEffect, useRef } from 'react';

interface Props {
  theme: 'light' | 'dark' | 'auto';
  mood?: number;
}

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  radius: number;
  colorLight: string;
  colorDark: string;
  phase: number;
  phaseSpeed: number;
  parallaxFactor: number;
}

export const LiveFluidBackground: React.FC<Props> = ({ theme, mood = 3 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const scrollRef = useRef<{ current: number; target: number }>({ current: 0, target: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      scrollRef.current.target = window.scrollY || document.documentElement.scrollTop || 0;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Palette-derived blob colors
    const blobs: Blob[] = [
      {
        x: width * 0.2,
        y: height * 0.25,
        vx: 0.15,
        vy: 0.12,
        baseRadius: Math.min(width, height) * 0.38,
        radius: Math.min(width, height) * 0.38,
        colorLight: 'rgba(183, 170, 208, 0.28)', // lavender
        colorDark: 'rgba(110, 95, 148, 0.24)',
        phase: 0,
        phaseSpeed: 0.007,
        parallaxFactor: 0.18,
      },
      {
        x: width * 0.8,
        y: height * 0.3,
        vx: -0.12,
        vy: 0.16,
        baseRadius: Math.min(width, height) * 0.42,
        radius: Math.min(width, height) * 0.42,
        colorLight: 'rgba(143, 169, 139, 0.26)', // sage
        colorDark: 'rgba(79, 107, 78, 0.22)',
        phase: Math.PI / 3,
        phaseSpeed: 0.006,
        parallaxFactor: -0.14,
      },
      {
        x: width * 0.5,
        y: height * 0.75,
        vx: 0.1,
        vy: -0.14,
        baseRadius: Math.min(width, height) * 0.44,
        radius: Math.min(width, height) * 0.44,
        colorLight: 'rgba(217, 211, 167, 0.22)', // soft gold / mood ramp 3
        colorDark: 'rgba(143, 169, 139, 0.16)',
        phase: Math.PI * 0.7,
        phaseSpeed: 0.005,
        parallaxFactor: 0.22,
      },
      {
        x: width * 0.85,
        y: height * 0.85,
        vx: -0.14,
        vy: -0.1,
        baseRadius: Math.min(width, height) * 0.35,
        radius: Math.min(width, height) * 0.35,
        colorLight: 'rgba(183, 170, 208, 0.20)', // lavender accent
        colorDark: 'rgba(110, 95, 148, 0.18)',
        phase: Math.PI * 1.2,
        phaseSpeed: 0.008,
        parallaxFactor: -0.20,
      },
    ];

    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark =
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        (theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches));

      if (prefersReduced) {
        // Draw static soft radial glow without motion
        const grad = ctx.createRadialGradient(width * 0.5, height * 0.3, 10, width * 0.5, height * 0.3, width * 0.6);
        grad.addColorStop(0, isDark ? 'rgba(79, 107, 78, 0.15)' : 'rgba(183, 170, 208, 0.12)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      t += 0.015;

      // Smooth damped scroll interpolation for liquid parallax
      scrollRef.current.current += (scrollRef.current.target - scrollRef.current.current) * 0.08;
      const smoothScroll = scrollRef.current.current;

      // Draw each fluid blob with scroll parallax
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];

        // Harmonic breath pulse (simulating 4-2-8 calm rhythm)
        b.phase += b.phaseSpeed;
        const breathScale = 1 + Math.sin(b.phase) * 0.12 + Math.cos(t * 0.4 + i) * 0.06;
        b.radius = b.baseRadius * breathScale;

        // Position drift
        b.x += b.vx;
        b.y += b.vy;

        // Boundary wrap with gentle margin
        if (b.x < -b.radius * 0.5) b.x = width + b.radius * 0.3;
        if (b.x > width + b.radius * 0.5) b.x = -b.radius * 0.3;
        if (b.y < -b.radius * 0.5) b.y = height + b.radius * 0.3;
        if (b.y > height + b.radius * 0.5) b.y = -b.radius * 0.3;

        // Dynamic Parallax shift based on page scroll
        const scrollOffsetY = (smoothScroll * b.parallaxFactor) % (height * 1.5);
        const renderedY = b.y - scrollOffsetY;

        // Subtle cursor attraction
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - b.x;
          const dy = mouseRef.current.y - renderedY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 20 && dist < 500) {
            b.x += (dx / dist) * 0.25;
            b.y += (dy / dist) * 0.25;
          }
        }

        // Draw soft radial blur blob
        const grad = ctx.createRadialGradient(b.x, renderedY, 0, b.x, renderedY, b.radius);
        const col = isDark ? b.colorDark : b.colorLight;
        grad.addColorStop(0, col);
        grad.addColorStop(0.55, col);
        grad.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, renderedY, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, [theme, mood]);

  return (
    <div className="live-fluid-bg-container" aria-hidden="true">
      <canvas ref={canvasRef} className="live-fluid-canvas" />
      <div className="live-fluid-vignette" />
    </div>
  );
};
