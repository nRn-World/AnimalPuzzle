import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import { StoryPage } from '../game/story';
import { AnimalSkinId } from '../game/types';
import { BossSvg, GemSvg } from './GemSvg';

interface StoryModalProps {
  page: StoryPage | null;
  skin: AnimalSkinId;
  onClose: () => void;
}

/** A comic page of the story, read one panel at a time. */
export const StoryModal: React.FC<StoryModalProps> = ({ page, skin, onClose }) => {
  const [index, setIndex] = useState(0);
  const pageId = page?.id;

  useEffect(() => {
    setIndex(0);
  }, [pageId]);

  const last = page ? index >= page.panels.length - 1 : true;
  const next = () => {
    if (last) onClose();
    else setIndex((i) => i + 1);
  };

  useEffect(() => {
    if (!page) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        next();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  if (!page) return null;
  const panel = page.panels[Math.min(index, page.panels.length - 1)];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-title"
      data-testid="story-modal"
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-[#111111]/80"
    >
      <div className="ui-panel w-full max-w-md max-h-[calc(100dvh-1.5rem)] flex flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 pb-2">
          <h2 id="story-title" className="font-display text-2xl leading-none tracking-wide">
            {t(page.titleSv)}
          </h2>
          <span className="font-mono-num text-xs font-extrabold text-[#4B4B4B]">
            {index + 1}/{page.panels.length}
          </span>
        </div>

        {/* The panel: a scene from the landscape, a caption box and a speech bubble */}
        <div
          key={index}
          data-testid="story-panel"
          className={`ui-story-panel relative overflow-hidden border-[3px] border-[#111111] ${
            panel.biome === 'skargard' ? 'ui-saga !overflow-hidden' : `ui-biome-${panel.biome}`
          }`}
        >
          <p className="relative z-10 m-2 inline-block max-w-[92%] border-[3px] border-[#111111] bg-[#FFF6C9] px-2 py-1 text-[13px] font-bold leading-snug text-[#111111] shadow-[3px_3px_0_#111111]">
            {t(panel.captionSv)}
          </p>
          <div className="relative z-10 flex items-end justify-center gap-1 px-3 pb-3 pt-10 sm:pt-12">
            {panel.cast.map((color, i) => (
              <span
                key={color}
                className={`relative ${i === 0 ? 'h-24 w-24 sm:h-28 sm:w-28' : 'h-16 w-16 sm:h-20 sm:w-20'} shrink-0`}
              >
                {i === 0 && panel.saySv && (
                  <span className="ui-speech absolute bottom-[92%] left-1/2 z-10 w-max max-w-[11rem] -translate-x-1/2 text-center text-xs font-extrabold leading-tight">
                    {t(panel.saySv)}
                  </span>
                )}
                <GemSvg color={color} special="none" skin={skin} animationSeed={i * 7 + 3} className="h-full w-full drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]" />
              </span>
            ))}
            {panel.boss && (
              <span className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 animate-menu-bob">
                <BossSvg biome={panel.biome} className="h-full w-full drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]" />
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" data-testid="story-skip" onClick={onClose} className="ui-btn px-3 py-1.5 text-sm">
            {t('Hoppa över')}
          </button>
          <button
            type="button"
            data-testid="story-next"
            autoFocus
            onClick={next}
            className="ui-btn ui-btn-green px-4 py-1.5 font-display text-lg tracking-wide"
          >
            {last ? t('Sätt igång!') : t('Nästa ruta')}
          </button>
        </div>
      </div>
    </div>
  );
};
