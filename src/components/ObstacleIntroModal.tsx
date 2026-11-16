import React, { useEffect } from 'react';
import { BiomeId } from '../game/biomes';
import { ObstacleIntroDef } from '../game/obstacleIntro';
import { t } from '../i18n';
import {
  BossSvg,
  ChainBadgeIcon,
  CrateSvg,
  EggSvg,
  HoneySvg,
  IceBadgeIcon,
} from './GemSvg';

interface ObstacleIntroModalProps {
  intro: ObstacleIntroDef | null;
  biome: BiomeId;
  onDismiss: () => void;
}

const ObstacleArt: React.FC<{ id: ObstacleIntroDef['id']; biome: BiomeId }> = ({ id, biome }) => {
  switch (id) {
    case 'ice':
      return <IceBadgeIcon className="h-16 w-16" />;
    case 'crate':
      return <CrateSvg hp={2} className="h-16 w-16" />;
    case 'chain':
      return <ChainBadgeIcon className="h-16 w-16" />;
    case 'honey':
      return <HoneySvg className="h-16 w-16" />;
    case 'egg':
      return <EggSvg className="h-16 w-16" />;
    case 'boss':
      return <BossSvg className="h-16 w-16" biome={biome} />;
    case 'bomb':
      return (
        <div className="grid h-14 w-14 place-items-center rounded-full border-4 border-[#111111] bg-[#FF2E4D] font-mono-num text-2xl font-extrabold text-white shadow-[3px_3px_0_#111111]">
          5
        </div>
      );
    case 'belt':
      return (
        <div className="grid h-14 w-20 place-items-center rounded border-[3px] border-[#111111] bg-[#3A3F4B]">
          <svg viewBox="0 0 40 40" className="h-10 w-10">
            <path
              d="M9 9 L20 20 L9 31 M22 9 L33 20 L22 31"
              fill="none"
              stroke="#F2CD1C"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    case 'portal':
      return (
        <div className="flex items-center gap-3">
          <span className="h-12 w-12 rounded-full border-4 border-dashed border-[#C77DFF] bg-[#C77DFF]/30" />
          <span className="h-12 w-12 rounded-full border-4 border-dashed border-[#3CE0C8] bg-[#3CE0C8]/30" />
        </div>
      );
  }
};

export const ObstacleIntroModal: React.FC<ObstacleIntroModalProps> = ({
  intro,
  biome,
  onDismiss,
}) => {
  useEffect(() => {
    if (!intro) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [intro, onDismiss]);

  if (!intro) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="obstacle-intro-title"
      data-testid="obstacle-intro-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/70 p-4"
    >
      <div className="ui-panel animate-menu-pop w-full max-w-sm space-y-4 p-4 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-2xl border-[3px] border-[#111111] bg-[#22307A] shadow-[4px_4px_0_#111111]">
          <ObstacleArt id={intro.id} biome={biome} />
        </div>
        <div className="space-y-1.5">
          <h2 id="obstacle-intro-title" className="font-display text-2xl tracking-wide text-[#D4002A]">
            {t(intro.titleSv)}
          </h2>
          <p className="ui-inset px-3 py-2 text-sm font-semibold leading-snug">
            {t(intro.descSv)}
          </p>
        </div>
        <button
          type="button"
          data-testid="obstacle-intro-ok"
          onClick={onDismiss}
          className="ui-btn ui-btn-green w-full px-4 py-2 font-display text-xl tracking-wide"
        >
          {t('Jag förstår!')}
        </button>
      </div>
    </div>
  );
};
