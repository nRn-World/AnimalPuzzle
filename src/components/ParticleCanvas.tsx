import React, { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import { BlastEvent, BOARD_SIZE, GEM_META, GemColor } from '../game/types';

export interface ParticleCanvasHandle {
  emitBlasts: (blasts: BlastEvent[]) => void;
  emitFloatingText: (row: number, col: number, text: string, color?: string) => void;
}

type ParticleShape = 'star' | 'confetti' | 'spark';

interface BurstParticle {
  active: boolean;
  shape: ParticleShape;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  rot: number;
  vrot: number;
}

interface BeamFlash {
  active: boolean;
  kind: 'beam_h' | 'beam_v' | 'nova' | 'prism';
  row: number;
  col: number;
  life: number;
  maxLife: number;
  color: string;
}

interface ShockRing {
  active: boolean;
  x: number;
  y: number;
  maxRadius: number;
  life: number;
  maxLife: number;
  color: string;
}

interface FloatingLabel {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

const MAX_PARTICLES = 220;
const MAX_BEAMS = 24;
const MAX_RINGS = 32;
const MAX_LABELS = 18;
const CELEBRATION_COLORS = ['#FF8A9B', '#FDE047', '#6EE7B7', '#93C5FD', '#D8B4FE', '#FFFFFF'];

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>((_, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<BurstParticle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      shape: 'star',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 5,
      life: 0,
      maxLife: 0.5,
      color: '#FDE047',
      rot: 0,
      vrot: 0,
    }))
  );
  const particleCursor = useRef(0);

  const beamsRef = useRef<BeamFlash[]>(
    Array.from({ length: MAX_BEAMS }, () => ({
      active: false,
      kind: 'beam_h',
      row: 0,
      col: 0,
      life: 0,
      maxLife: 0.35,
      color: '#FDE047',
    }))
  );
  const beamCursor = useRef(0);

  const ringsRef = useRef<ShockRing[]>(
    Array.from({ length: MAX_RINGS }, () => ({
      active: false,
      x: 0,
      y: 0,
      maxRadius: 40,
      life: 0,
      maxLife: 0.35,
      color: '#FDE047',
    }))
  );
  const ringCursor = useRef(0);

  const labelsRef = useRef<FloatingLabel[]>(
    Array.from({ length: MAX_LABELS }, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: -42,
      text: '',
      color: '#FDE047',
      life: 0,
      maxLife: 0.85,
    }))
  );
  const labelCursor = useRef(0);

  const sizeRef = useRef<{ width: number; height: number }>({ width: 512, height: 512 });

  const spawnParticle = (
    x: number,
    y: number,
    color: string,
    shape: ParticleShape,
    speedScale = 1
  ) => {
    const pool = particlesRef.current;
    const p = pool[particleCursor.current];
    particleCursor.current = (particleCursor.current + 1) % MAX_PARTICLES;

    const angle = Math.random() * Math.PI * 2;
    const speed = (75 + Math.random() * 175) * speedScale;
    p.active = true;
    p.shape = shape;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 55;
    p.size = shape === 'star' ? 5 + Math.random() * 5 : 4 + Math.random() * 4;
    p.maxLife = 0.42 + Math.random() * 0.28;
    p.life = p.maxLife;
    p.color = color;
    p.rot = Math.random() * Math.PI * 2;
    p.vrot = (Math.random() - 0.5) * 12;
  };

  const spawnRing = (x: number, y: number, maxRadius: number, color: string, duration = 0.36) => {
    const pool = ringsRef.current;
    const r = pool[ringCursor.current];
    ringCursor.current = (ringCursor.current + 1) % MAX_RINGS;
    r.active = true;
    r.x = x;
    r.y = y;
    r.maxRadius = maxRadius;
    r.maxLife = duration;
    r.life = duration;
    r.color = color;
  };

  const spawnBeam = (
    kind: 'beam_h' | 'beam_v' | 'nova' | 'prism',
    row: number,
    col: number,
    color: string
  ) => {
    const pool = beamsRef.current;
    const b = pool[beamCursor.current];
    beamCursor.current = (beamCursor.current + 1) % MAX_BEAMS;
    b.active = true;
    b.kind = kind;
    b.row = row;
    b.col = col;
    b.maxLife = kind === 'prism' ? 0.46 : 0.34;
    b.life = b.maxLife;
    b.color = color;
  };

  useImperativeHandle(ref, () => ({
    emitBlasts(blasts: BlastEvent[]) {
      const { width, height } = sizeRef.current;
      const cellW = width / BOARD_SIZE;
      const cellH = height / BOARD_SIZE;

      for (const b of blasts) {
        const cx = (b.col + 0.5) * cellW;
        const cy = (b.row + 0.5) * cellH;
        const colorHex = b.color
          ? GEM_META[b.color as GemColor].lightHex
          : b.type === 'ice'
          ? '#7DD3FC'
          : b.type === 'crate'
          ? '#FDE68A'
          : '#FDE047';

        if (b.type === 'beam_h' || b.type === 'beam_v' || b.type === 'nova' || b.type === 'prism') {
          spawnBeam(b.type, b.row, b.col, colorHex);
          spawnRing(
            cx,
            cy,
            b.type === 'prism' ? width * 0.55 : cellW * 2.2,
            colorHex,
            b.type === 'prism' ? 0.48 : 0.36
          );
          const count = b.type === 'prism' ? 26 : 16;
          for (let i = 0; i < count; i++) {
            const pColor =
              b.type === 'prism'
                ? CELEBRATION_COLORS[i % CELEBRATION_COLORS.length]
                : i % 2 === 0
                ? colorHex
                : '#FDE047';
            const shape: ParticleShape = i % 3 === 0 ? 'confetti' : 'star';
            spawnParticle(cx, cy, pColor, shape, 1.45);
          }
        } else {
          spawnRing(cx, cy, cellW * 0.85, colorHex, 0.28);
          const count = b.type === 'match' ? 5 : 9;
          for (let i = 0; i < count; i++) {
            const shape: ParticleShape = i % 2 === 0 ? 'star' : 'confetti';
            spawnParticle(
              cx,
              cy,
              i === 0 ? '#FFFFFF' : colorHex,
              shape,
              0.95
            );
          }
        }
      }
    },
    emitFloatingText(row: number, col: number, text: string, color = '#FDE047') {
      const { width, height } = sizeRef.current;
      const cellW = width / BOARD_SIZE;
      const cellH = height / BOARD_SIZE;
      const pool = labelsRef.current;
      const l = pool[labelCursor.current];
      labelCursor.current = (labelCursor.current + 1) % MAX_LABELS;
      l.active = true;
      l.x = Math.max(48, Math.min(width - 48, (col + 0.5) * cellW));
      l.y = Math.max(24, (row + 0.5) * cellH);
      l.vy = -48;
      l.text = text;
      l.color = color;
      l.maxLife = 0.86;
      l.life = l.maxLife;
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (rect.width > 0 && rect.height > 0) {
        sizeRef.current = { width: rect.width, height: rect.height };
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(canvas);

    let rafId = 0;
    let lastTime = performance.now();

    const drawFourPointStar = (ctx2d: CanvasRenderingContext2D, r: number) => {
      ctx2d.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.38;
        const a = (i * Math.PI) / 4;
        if (i === 0) ctx2d.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx2d.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx2d.closePath();
      ctx2d.fill();
    };

    const loop = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const cellW = width / BOARD_SIZE;
      const cellH = height / BOARD_SIZE;

      // 1. Shockwave rings
      const rings = ringsRef.current;
      for (let i = 0; i < MAX_RINGS; i++) {
        const r = rings[i];
        if (!r.active) continue;
        r.life -= dt;
        if (r.life <= 0) {
          r.active = false;
          continue;
        }
        const progress = 1 - r.life / r.maxLife;
        const radius = r.maxRadius * (0.2 + progress * 0.8);
        ctx.save();
        ctx.globalAlpha = (1 - progress) * 0.85;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = Math.max(1.5, 5 * (1 - progress));
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Dual-layer Beams, Novas, & Prism rays
      const beams = beamsRef.current;
      for (let i = 0; i < MAX_BEAMS; i++) {
        const b = beams[i];
        if (!b.active) continue;
        b.life -= dt;
        if (b.life <= 0) {
          b.active = false;
          continue;
        }
        const t = b.life / b.maxLife;
        const progress = 1 - t;
        ctx.save();

        if (b.kind === 'beam_h') {
          const cy = (b.row + 0.5) * cellH;
          const h = cellH * 0.58 * t;
          ctx.globalAlpha = t * 0.55;
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(0, cy - h * 0.5, width, h);
          ctx.globalAlpha = t * 0.95;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, cy - h * 0.2, width, h * 0.4);
          // Shooting comets along beam
          const cx = (b.col + 0.5) * cellW;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx - progress * width * 0.55, cy, 5 * t, 0, Math.PI * 2);
          ctx.arc(cx + progress * width * 0.55, cy, 5 * t, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.kind === 'beam_v') {
          const cx = (b.col + 0.5) * cellW;
          const w = cellW * 0.58 * t;
          ctx.globalAlpha = t * 0.55;
          ctx.fillStyle = '#FDE047';
          ctx.fillRect(cx - w * 0.5, 0, w, height);
          ctx.globalAlpha = t * 0.95;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(cx - w * 0.2, 0, w * 0.4, height);
          const cy = (b.row + 0.5) * cellH;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(cx, cy - progress * height * 0.55, 5 * t, 0, Math.PI * 2);
          ctx.arc(cx, cy + progress * height * 0.55, 5 * t, 0, Math.PI * 2);
          ctx.fill();
        } else if (b.kind === 'nova') {
          const cx = (b.col + 0.5) * cellW;
          const cy = (b.row + 0.5) * cellH;
          ctx.globalAlpha = t * 0.85;
          ctx.strokeStyle = '#FDE047';
          ctx.lineWidth = 3 * t;
          for (let ray = 0; ray < 8; ray++) {
            const a = (ray * Math.PI) / 4 + progress * 0.6;
            const rInner = cellW * 0.35;
            const rOuter = cellW * (1.2 + progress * 1.4);
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * rInner, cy + Math.sin(a) * rInner);
            ctx.lineTo(cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter);
            ctx.stroke();
          }
        } else if (b.kind === 'prism') {
          const cx = (b.col + 0.5) * cellW;
          const cy = (b.row + 0.5) * cellH;
          ctx.globalAlpha = t * 0.8;
          for (let ray = 0; ray < 12; ray++) {
            const a = (ray * Math.PI) / 6 + progress * 0.8;
            ctx.strokeStyle = CELEBRATION_COLORS[ray % CELEBRATION_COLORS.length];
            ctx.lineWidth = 4 * t;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
              cx + Math.cos(a) * width * (0.35 + progress * 0.45),
              cy + Math.sin(a) * height * (0.35 + progress * 0.45)
            );
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 3. Twinkling Stars & Confetti Particles
      const particles = particlesRef.current;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) {
          p.active = false;
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 280 * dt;
        p.rot += p.vrot * dt;

        const alpha = Math.min(1, (p.life / p.maxLife) * 1.25);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawFourPointStar(ctx, p.size);
        } else if (p.shape === 'confetti') {
          ctx.fillRect(-p.size * 0.65, -p.size * 0.35, p.size * 1.3, p.size * 0.7);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Bouncy Celebratory Floating Text
      const labels = labelsRef.current;
      for (let i = 0; i < MAX_LABELS; i++) {
        const l = labels[i];
        if (!l.active) continue;
        l.life -= dt;
        if (l.life <= 0) {
          l.active = false;
          continue;
        }
        l.y += l.vy * dt;
        const progress = 1 - l.life / l.maxLife;
        const popScale = progress < 0.18 ? 0.75 + (progress / 0.18) * 0.45 : 1.05;
        const alpha = Math.min(1, (l.life / l.maxLife) * 1.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(l.x, l.y);
        ctx.scale(popScale, popScale);
        ctx.font = '700 16px "Bricolage Grotesque", "JetBrains Mono", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#0F1219';
        ctx.strokeText(l.text, 0, 0);
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, 0, 0);
        ctx.restore();
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="fx-canvas"
      className="pointer-events-none absolute inset-0 w-full h-full z-20"
      aria-hidden="true"
    />
  );
});

ParticleCanvas.displayName = 'ParticleCanvas';
