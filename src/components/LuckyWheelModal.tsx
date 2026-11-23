import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../game/audio';
import { prefersReducedMotion } from '../game/settings';
import { WHEEL_SLICES, WheelSlice } from '../game/starChest';
import { t } from '../i18n';

interface LuckyWheelModalProps {
  open: boolean;
  canSpin: boolean;
  onSpin: () => { sliceIndex: number; slice: WheelSlice } | null;
  onClose: () => void;
}

const SLICE_COUNT = WHEEL_SLICES.length;
const SLICE_DEG = 360 / SLICE_COUNT;

function slicePath(index: number, radius: number): string {
  const startAngle = ((index * SLICE_DEG - 90) * Math.PI) / 180;
  const endAngle = (((index + 1) * SLICE_DEG - 90) * Math.PI) / 180;
  const x1 = radius + radius * Math.cos(startAngle);
  const y1 = radius + radius * Math.sin(startAngle);
  const x2 = radius + radius * Math.cos(endAngle);
  const y2 = radius + radius * Math.sin(endAngle);
  return `M ${radius} ${radius} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
}

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  open,
  canSpin,
  onSpin,
  onClose,
}) => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [wonSlice, setWonSlice] = useState<WheelSlice | null>(null);
  const spinTimerRef = useRef<number | null>(null);

  // Clear previous prize banner only when freshly opening the modal.
  useEffect(() => {
    if (open) {
      setWonSlice(null);
    } else if (spinTimerRef.current !== null) {
      window.clearTimeout(spinTimerRef.current);
      spinTimerRef.current = null;
      setSpinning(false);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current !== null) {
        window.clearTimeout(spinTimerRef.current);
        spinTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !spinning) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, spinning]);

  if (!open) return null;

  const handleSpin = () => {
    if (!canSpin || spinning) return;
    const outcome = onSpin();
    if (!outcome) return;

    const sliceCenterDeg = outcome.sliceIndex * SLICE_DEG + SLICE_DEG / 2;
    const targetMod = (360 - sliceCenterDeg) % 360;
    const spins = prefersReducedMotion() ? 0 : 5 * 360;
    setSpinning(true);
    setWonSlice(null);
    soundEngine.playClick();
    setRotation((prev) => {
      const currentMod = prev % 360;
      const delta = (targetMod - currentMod + 360) % 360;
      return prev + spins + delta;
    });

    const delay = prefersReducedMotion() ? 50 : 3200;
    if (spinTimerRef.current !== null) window.clearTimeout(spinTimerRef.current);
    spinTimerRef.current = window.setTimeout(() => {
      spinTimerRef.current = null;
      setSpinning(false);
      setWonSlice(outcome.slice);
      soundEngine.playVictory();
    }, delay);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lucky-wheel-title"
      data-testid="lucky-wheel-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/75 p-4"
    >
      <div className="ui-panel animate-menu-pop w-full max-w-sm space-y-4 p-4 text-center">
        <div className="flex items-center justify-between gap-2">
          <h2 id="lucky-wheel-title" className="font-display text-2xl tracking-wide text-[#D4002A]">
            {t('Dagens lyckohjul')}
          </h2>
          <button
            type="button"
            disabled={spinning}
            onClick={onClose}
            className="ui-btn ui-btn-red px-2 py-1 text-xs disabled:opacity-50"
          >
            {t('Stäng')}
          </button>
        </div>

        {/* Spinning SVG wheel + top pointer */}
        <div className="relative mx-auto w-64 h-64 select-none">
          <div
            aria-hidden="true"
            className="absolute left-1/2 -top-2 z-20 -translate-x-1/2"
          >
            <svg width="26" height="28" viewBox="0 0 26 28">
              <path
                d="M13 26 L2 4 L24 4 Z"
                fill="#FF2E4D"
                stroke="#111111"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div
            className="h-full w-full rounded-full border-4 border-[#111111] shadow-[4px_4px_0_#111111] overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? 'transform 3.15s cubic-bezier(0.14, 0.88, 0.22, 1)'
                : 'none',
            }}
          >
            <svg viewBox="0 0 240 240" className="h-full w-full">
              {WHEEL_SLICES.map((slice, idx) => {
                const midDeg = idx * SLICE_DEG + SLICE_DEG / 2;
                return (
                  <g key={slice.id}>
                    <path
                      d={slicePath(idx, 120)}
                      fill={slice.accent}
                      stroke="#111111"
                      strokeWidth="2.5"
                    />
                    <text
                      x="120"
                      y="34"
                      textAnchor="middle"
                      fill="#111111"
                      fontSize="10.5"
                      fontWeight="900"
                      transform={`rotate(${midDeg} 120 120)`}
                    >
                      {t(slice.labelSv)}
                    </text>
                  </g>
                );
              })}
              <circle cx="120" cy="120" r="22" fill="#FFFDF4" stroke="#111111" strokeWidth="4" />
              <circle cx="120" cy="120" r="8" fill="#F2CD1C" stroke="#111111" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {wonSlice ? (
          <div
            data-testid="wheel-result"
            className="border-[3px] border-[#111111] bg-[var(--ui-yellow)] px-3 py-2 font-display text-xl tracking-wide"
          >
            {t('Du vann: {prize}!', { prize: t(wonSlice.labelSv) })}
          </div>
        ) : (
          <p className="text-xs font-bold text-[#4B4B4B]">
            {canSpin
              ? t('Ett gratis snurr varje dag – vinn bonusenergi, gratis boosters eller fulla liv!')
              : t('Dagens snurr är använt. Kom tillbaka imorgon!')}
          </p>
        )}

        <button
          type="button"
          data-testid="spin-wheel-btn"
          disabled={!canSpin || spinning}
          onClick={handleSpin}
          className="ui-btn ui-btn-green w-full px-4 py-2 font-display text-xl tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
        >
          {spinning
            ? t('Snurrar...')
            : canSpin
            ? t('Snurra gratis!')
            : t('Kom tillbaka imorgon')}
        </button>
      </div>
    </div>
  );
};
