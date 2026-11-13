import React, { useEffect, useRef } from 'react';

interface WorkshopFireCanvasProps {
  backdropSrc: string;
}

interface OccluderEllipse {
  kind: 'ellipse';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface OccluderCapsule {
  kind: 'capsule';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  radius: number;
}

// Static silhouettes that stand in front of a flame zone (logical backdrop pixels, 688x384).
// The animated flame is fully masked out here so fire always stays behind the object.
type OccluderShape = OccluderEllipse | OccluderCapsule;

interface FlameZoneConfig {
  id: string;
  // Normalized coordinates (0..1) inside the 1376x768 workshop backdrop
  cxNorm: number;
  wickYNorm: number;
  widthNorm: number;
  heightNorm: number;
  ampX: number;
  ampStretch: number;
  speed: number;
  seed: number;
  multiTongue: boolean;
  emberTint: [number, number, number];
  occluders?: OccluderShape[];
}

const LOGICAL_W = 688;
const LOGICAL_H = 384;

const FLAME_ZONES: FlameZoneConfig[] = [
  // Left candle on right desk
  {
    id: 'candle-left',
    cxNorm: 0.8946,
    wickYNorm: 0.448,
    widthNorm: 0.038,
    heightNorm: 0.102,
    ampX: 5.4,
    ampStretch: 0.36,
    speed: 6.4,
    seed: 1.1,
    multiTongue: false,
    emberTint: [24, 18, 15],
  },
  // Taller right candle on brass holder
  {
    id: 'candle-right',
    cxNorm: 0.9186,
    wickYNorm: 0.394,
    widthNorm: 0.038,
    heightNorm: 0.106,
    ampX: 5.8,
    ampStretch: 0.38,
    speed: 5.9,
    seed: 3.4,
    multiTongue: false,
    emberTint: [24, 18, 15],
  },
  // Front-right glass oil lamp
  {
    id: 'oil-lamp',
    cxNorm: 0.9542,
    wickYNorm: 0.612,
    widthNorm: 0.044,
    heightNorm: 0.122,
    ampX: 5.0,
    ampStretch: 0.34,
    speed: 5.5,
    seed: 5.2,
    multiTongue: false,
    emberTint: [42, 27, 14],
  },
  // Hanging iron lantern inside archway
  {
    id: 'lantern',
    cxNorm: 0.6686,
    wickYNorm: 0.286,
    widthNorm: 0.046,
    heightNorm: 0.082,
    ampX: 4.4,
    ampStretch: 0.30,
    speed: 5.1,
    seed: 2.3,
    multiTongue: true,
    emberTint: [30, 19, 12],
  },
  // Stone hearth oven (center-left)
  {
    id: 'hearth',
    cxNorm: 0.578,
    wickYNorm: 0.498,
    widthNorm: 0.086,
    heightNorm: 0.102,
    ampX: 6.4,
    ampStretch: 0.38,
    speed: 6.8,
    seed: 4.1,
    multiTongue: true,
    emberTint: [34, 18, 10],
  },
  // Arch kiln behind distillation flasks
  {
    id: 'kiln',
    cxNorm: 0.708,
    wickYNorm: 0.468,
    widthNorm: 0.088,
    heightNorm: 0.156,
    ampX: 6.6,
    ampStretch: 0.36,
    speed: 6.0,
    seed: 6.7,
    multiTongue: true,
    emberTint: [40, 21, 11],
    // Distillation retort standing in front of the kiln arch
    occluders: [
      { kind: 'ellipse', cx: 503.5, cy: 154, rx: 17.5, ry: 15 },
      { kind: 'capsule', x1: 501.5, y1: 142, x2: 501.5, y2: 112, radius: 6.5 },
      { kind: 'ellipse', cx: 502, cy: 106, rx: 8, ry: 7 },
      { kind: 'capsule', x1: 496, y1: 169, x2: 514, y2: 169, radius: 4.5 },
      { kind: 'capsule', x1: 506, y1: 137, x2: 540, y2: 119, radius: 2.4 },
    ],
  },
];

interface PreparedPatch {
  config: FlameZoneConfig;
  x0: number;
  y0: number;
  pw: number;
  ph: number;
  wickLocalY: number;
  cxLocal: number;
  // Original image RGB (3 bytes per pixel)
  srcRgb: Uint8ClampedArray;
  // Computed per-pixel flame mask (0..1) and foreground dark occlusion lock (0..1)
  flameMask: Float32Array;
  fgLock: Float32Array;
  // Hard occlusion from explicit foreground silhouettes (1 = fully covered by object)
  occlusion: Float32Array;
  // Per-pixel background replacement RGB (0..255)
  bgRgb: Uint8ClampedArray;
  // Scratch buffer for rendering
  outImgData: ImageData;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function occluderDistance(x: number, y: number, shape: OccluderShape): number {
  if (shape.kind === 'ellipse') {
    const nx = (x - shape.cx) / shape.rx;
    const ny = (y - shape.cy) / shape.ry;
    return (Math.hypot(nx, ny) - 1) * Math.min(shape.rx, shape.ry);
  }

  const dx = shape.x2 - shape.x1;
  const dy = shape.y2 - shape.y1;
  const lenSq = dx * dx + dy * dy;
  const t =
    lenSq === 0 ? 0 : clamp(((x - shape.x1) * dx + (y - shape.y1) * dy) / lenSq, 0, 1);
  const px = shape.x1 + dx * t;
  const py = shape.y1 + dy * t;
  return Math.hypot(x - px, y - py) - shape.radius;
}

function buildPatch(
  config: FlameZoneConfig,
  fullData: Uint8ClampedArray,
  scratchCtx: CanvasRenderingContext2D
): PreparedPatch {
  const cx = Math.round(config.cxNorm * LOGICAL_W);
  const wickY = Math.round(config.wickYNorm * LOGICAL_H);
  const pw = Math.max(20, Math.round(config.widthNorm * LOGICAL_W));
  const ph = Math.max(24, Math.round(config.heightNorm * LOGICAL_H));

  const x0 = clamp(cx - Math.floor(pw / 2), 0, LOGICAL_W - pw);
  const y0 = clamp(wickY - ph + 3, 0, LOGICAL_H - ph);
  const wickLocalY = wickY - y0;
  const cxLocal = cx - x0;

  const total = pw * ph;
  const srcRgb = new Uint8ClampedArray(total * 3);
  const flameMask = new Float32Array(total);
  const fgLock = new Float32Array(total);
  const occlusion = new Float32Array(total);
  const bgRgb = new Uint8ClampedArray(total * 3);

  if (config.occluders && config.occluders.length > 0) {
    for (let ly = 0; ly < ph; ly++) {
      for (let lx = 0; lx < pw; lx++) {
        const gx = x0 + lx + 0.5;
        const gy = y0 + ly + 0.5;
        let dist = Infinity;
        for (const shape of config.occluders) {
          dist = Math.min(dist, occluderDistance(gx, gy, shape));
        }
        // 1px anti-aliased edge keeps the silhouette from looking cut out
        occlusion[ly * pw + lx] = clamp(0.5 - dist, 0, 1);
      }
    }
  }

  const rx = pw * 0.45;
  const ry = ph * 0.49;
  const midY = ph * 0.54;

  for (let ly = 0; ly < ph; ly++) {
    const gy = y0 + ly;
    // Clamp below wick base so candle wax / brass burner / stone shelf never shifts
    const aboveWick = clamp((wickLocalY + 1.5 - ly) / 3.0, 0, 1);

    let rowBgR = 0;
    let rowBgG = 0;
    let rowBgB = 0;
    let rowBgW = 0;

    for (let lx = 0; lx < pw; lx++) {
      const gx = x0 + lx;
      const gIdx = (gy * LOGICAL_W + gx) * 4;
      const idx = ly * pw + lx;

      const r = fullData[gIdx];
      const g = fullData[gIdx + 1];
      const b = fullData[gIdx + 2];

      srcRgb[idx * 3] = r;
      srcRgb[idx * 3 + 1] = g;
      srcRgb[idx * 3 + 2] = b;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const warm = r - b;

      const dxNorm = (lx - cxLocal) / rx;
      const dyNorm = (ly - midY) / ry;
      const dist = Math.hypot(dxNorm, dyNorm);
      const spatialFade = smoothstep(1.0, 0.26, dist) * aboveWick;

      const brightScore = clamp((lum - 54) / 72, 0, 1);
      const warmScore = clamp((warm - 12) / 34, 0, 1);
      const hotCore = clamp((lum - 165) / 50, 0, 1);
      const mask = spatialFade * Math.max(brightScore * warmScore, hotCore);

      flameMask[idx] = mask;

      // Dark foreground silhouettes (lantern bars, flask neck/tripod) stay anchored on top
      fgLock[idx] = clamp((58 - lum) / 26, 0, 1);

      // Accumulate dark/non-flame surrounding pixels on the outer sides of this row
      if (mask < 0.12 && Math.abs(dxNorm) > 0.45) {
        const w = 1 - mask;
        rowBgR += r * w;
        rowBgG += g * w;
        rowBgB += b * w;
        rowBgW += w;
      }
    }

    const fallbackR = rowBgW > 0.5 ? rowBgR / rowBgW : config.emberTint[0];
    const fallbackG = rowBgW > 0.5 ? rowBgG / rowBgW : config.emberTint[1];
    const fallbackB = rowBgW > 0.5 ? rowBgB / rowBgW : config.emberTint[2];

    for (let lx = 0; lx < pw; lx++) {
      const idx = ly * pw + lx;
      bgRgb[idx * 3] = Math.round(fallbackR * 0.72 + config.emberTint[0] * 0.28);
      bgRgb[idx * 3 + 1] = Math.round(fallbackG * 0.72 + config.emberTint[1] * 0.28);
      bgRgb[idx * 3 + 2] = Math.round(fallbackB * 0.72 + config.emberTint[2] * 0.28);
    }
  }

  return {
    config,
    x0,
    y0,
    pw,
    ph,
    wickLocalY,
    cxLocal,
    srcRgb,
    flameMask,
    fgLock,
    occlusion,
    bgRgb,
    outImgData: scratchCtx.createImageData(pw, ph),
  };
}

function sampleFlameBilinear(
  patch: PreparedPatch,
  sx: number,
  sy: number
): [number, number, number, number] {
  const { pw, ph, srcRgb, flameMask } = patch;
  if (sx < 0 || sx >= pw - 1 || sy < 0 || sy >= ph - 1) {
    return [0, 0, 0, 0];
  }
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const fx = sx - x0;
  const fy = sy - y0;

  const i00 = y0 * pw + x0;
  const i10 = i00 + 1;
  const i01 = i00 + pw;
  const i11 = i01 + 1;

  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;

  const a =
    flameMask[i00] * w00 +
    flameMask[i10] * w10 +
    flameMask[i01] * w01 +
    flameMask[i11] * w11;

  if (a < 0.005) return [0, 0, 0, 0];

  const r =
    srcRgb[i00 * 3] * w00 +
    srcRgb[i10 * 3] * w10 +
    srcRgb[i01 * 3] * w01 +
    srcRgb[i11 * 3] * w11;
  const g =
    srcRgb[i00 * 3 + 1] * w00 +
    srcRgb[i10 * 3 + 1] * w10 +
    srcRgb[i01 * 3 + 1] * w01 +
    srcRgb[i11 * 3 + 1] * w11;
  const b =
    srcRgb[i00 * 3 + 2] * w00 +
    srcRgb[i10 * 3 + 2] * w10 +
    srcRgb[i01 * 3 + 2] * w01 +
    srcRgb[i11 * 3 + 2] * w11;

  return [r, g, b, a];
}

export const WorkshopFireCanvas: React.FC<WorkshopFireCanvasProps> = ({ backdropSrc }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      return;
    }

    let cancelled = false;
    let rafId = 0;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = backdropSrc;

    img.onload = () => {
      if (cancelled) return;

      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = LOGICAL_W;
      srcCanvas.height = LOGICAL_H;
      const srcCtx = srcCanvas.getContext('2d');
      if (!srcCtx) return;

      srcCtx.drawImage(img, 0, 0, LOGICAL_W, LOGICAL_H);
      const fullData = srcCtx.getImageData(0, 0, LOGICAL_W, LOGICAL_H).data;

      const scratchCanvas = document.createElement('canvas');
      scratchCanvas.width = 96;
      scratchCanvas.height = 96;
      const scratchCtx = scratchCanvas.getContext('2d');
      if (!scratchCtx) return;

      const patches = FLAME_ZONES.map((zone) => buildPatch(zone, fullData, scratchCtx));
      const startMs = performance.now();

      const renderPatch = (patch: PreparedPatch, elapsed: number) => {
        const { pw, ph, wickLocalY, flameMask, fgLock, occlusion, bgRgb, outImgData, config } =
          patch;
        const out = outImgData.data;
        const { ampX, ampStretch, speed, seed, multiTongue } = config;

        const baseStretch =
          1 +
          ampStretch * 0.68 * Math.sin(elapsed * speed * 0.92 + seed) +
          ampStretch * 0.36 * Math.cos(elapsed * speed * 1.73 + seed * 1.9);

        const globalGust =
          Math.sin(elapsed * 1.65 + seed) * (ampX * 0.34) +
          Math.cos(elapsed * 2.9 + seed * 0.7) * (ampX * 0.16);

        const flickerLum =
          1.02 +
          0.22 * Math.sin(elapsed * speed * 1.45 + seed) +
          0.11 * Math.cos(elapsed * speed * 2.8 + seed);

        for (let ly = 0; ly < ph; ly++) {
          const distUp = Math.max(0, wickLocalY - ly);
          const h = clamp(distUp / Math.max(1, wickLocalY * 0.78), 0, 1.35);

          // Traveling upward fire wave (kink forms near wick and climbs smoothly to tip)
          const travelPhase = elapsed * speed - h * 4.4 + seed;
          const baseSway =
            (h * 0.42 + h * h * 0.58) *
            (globalGust +
              Math.sin(travelPhase) * (ampX * 0.62) +
              Math.sin(travelPhase * 1.93 + 1.2) * (ampX * 0.28));

          for (let lx = 0; lx < pw; lx++) {
            const idx = ly * pw + lx;
            const outIdx = idx * 4;

            const staticMask = flameMask[idx];
            const lock = fgLock[idx];
            // Foreground objects always win: never paint fire on top of them
            const visibility = 1 - occlusion[idx];
            const openness = (1 - lock * 0.92) * visibility;

            // Local spatial turbulence for wide multi-tongue hearths & kiln fire
            const xTurbulence = multiTongue
              ? Math.sin(lx * 0.34 + elapsed * speed * 0.85 - ly * 0.22 + seed) * (ampX * 0.38 * h)
              : 0;
            const localStretch = multiTongue
              ? baseStretch + 0.14 * Math.sin(lx * 0.41 - elapsed * speed * 1.15 + seed)
              : baseStretch;

            const sway = baseSway + xTurbulence;
            const sx = lx - sway;
            const sy = wickLocalY - (wickLocalY - ly) / Math.max(0.7, localStretch);

            const [wr, wg, wb, waRaw] = sampleFlameBilinear(patch, sx, sy);
            const wa = clamp(waRaw * openness, 0, 1);

            // Suppress the rigid static flame behind where it moved away
            const eraseA = staticMask * openness;
            const finalA = Math.max(eraseA, wa);

            if (finalA < 0.008) {
              out[outIdx] = 0;
              out[outIdx + 1] = 0;
              out[outIdx + 2] = 0;
              out[outIdx + 3] = 0;
              continue;
            }

            const bgR = bgRgb[idx * 3];
            const bgG = bgRgb[idx * 3 + 1];
            const bgB = bgRgb[idx * 3 + 2];

            // Blend animated warped flame over suppressed dark background
            const flameMix = wa / finalA;
            const litR = clamp(wr * flickerLum, 0, 255);
            const litG = clamp(wg * flickerLum, 0, 255);
            const litB = clamp(wb * (0.94 + (flickerLum - 0.95) * 0.5), 0, 255);

            out[outIdx] = Math.round(bgR * (1 - flameMix) + litR * flameMix);
            out[outIdx + 1] = Math.round(bgG * (1 - flameMix) + litG * flameMix);
            out[outIdx + 2] = Math.round(bgB * (1 - flameMix) + litB * flameMix);
            out[outIdx + 3] = Math.round(finalA * 255);
          }
        }

        scratchCtx.clearRect(0, 0, pw, ph);
        scratchCtx.putImageData(outImgData, 0, 0);
        ctx.drawImage(scratchCanvas, 0, 0, pw, ph, patch.x0, patch.y0, pw, ph);
      };

      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = (now - startMs) / 1000;
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
        for (let i = 0; i < patches.length; i++) {
          renderPatch(patches[i], elapsed);
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    };

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [backdropSrc]);

  return (
    <canvas
      ref={canvasRef}
      width={LOGICAL_W}
      height={LOGICAL_H}
      data-testid="workshop-fire-canvas"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
};
