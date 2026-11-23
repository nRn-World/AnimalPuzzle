import React from 'react';

/**
 * The unique 3D effect for the PRISM STORM combo (two Prism Stars fused):
 * the two stars streak in from opposite sides of the board while spinning
 * in 3D, collide at the centre, and detonate into a golden burst that
 * rotates in 3D space while tilted shockwave rings sweep across the field.
 *
 * The overlay is purely cosmetic (pointer-events: none) and self-expires:
 * every animation fills to opacity 0 by 1.5 s, and the parent unmounts it
 * when the combo notice clears.
 */

const starPoints = (spikes: number, outer: number, inner: number): string => {
  const pts: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
};

const SPARKS: Array<React.CSSProperties> = Array.from({ length: 10 }, (_, i) => {
  const a = (i / 10) * Math.PI * 2 + 0.4;
  return {
    '--sx': `${(Math.cos(a) * 44).toFixed(1)}vmin`,
    '--sy': `${(Math.sin(a) * 40).toFixed(1)}vmin`,
    '--sz': `${(60 + (i % 4) * 45).toFixed(0)}px`,
    '--sd': `${520 + (i % 5) * 45}ms`,
  } as React.CSSProperties;
});

/** The Prism Star badge, matching the board's prism special. */
const StarBadge: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <circle cx="32" cy="32" r="27" fill="#1E1B3A" stroke="#FDE047" strokeWidth="2.6" />
    <circle cx="32" cy="32" r="22" fill="none" stroke="#EC4899" strokeWidth="2.4" strokeDasharray="10 6" />
    <polygon
      points="32,8 37,24 54,24 40,34 45,51 32,41 19,51 24,34 10,24 27,24"
      fill="#FDE047"
      stroke="#0F1219"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="27.5" cy="31" r="2.2" fill="#0F1219" />
    <circle cx="36.5" cy="31" r="2.2" fill="#0F1219" />
    <path d="M29 35.5 Q32 38.5 35 35.5" fill="none" stroke="#0F1219" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const StarStormFx: React.FC = () => (
  <div data-testid="star-storm-fx" aria-hidden="true" className="star-storm-fx">
    {/* Tilted 3D light rays radiating from the impact point */}
    <div className="star-storm-rays" />
    {/* Two tilted 3D shockwave rings sweeping out at the collision */}
    <div className="star-storm-wave star-storm-wave-a" />
    <div className="star-storm-wave star-storm-wave-b" />
    {/* The two stars streaking in from opposite sides, spinning in 3D */}
    <StarBadge className="star-storm-star star-storm-star-left" />
    <StarBadge className="star-storm-star star-storm-star-right" />
    {/* White-gold impact flash */}
    <div className="star-storm-flash" />
    {/* The 3D-rotating golden burst star */}
    <div className="star-storm-burst">
      <svg viewBox="0 0 200 200" aria-hidden="true">
        <polygon
          points={starPoints(12, 96, 46)}
          fill="#FDE047"
          stroke="#0F1219"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <polygon
          points={starPoints(12, 62, 28)}
          fill="#FFF8DC"
          stroke="#B86E00"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="100" cy="100" r="14" fill="#1E1B3A" stroke="#FDE047" strokeWidth="3" />
      </svg>
    </div>
    {/* 3D spark shards flying out of the burst */}
    {SPARKS.map((style, i) => (
      <span key={i} className="star-storm-spark" style={style} />
    ))}
  </div>
);
