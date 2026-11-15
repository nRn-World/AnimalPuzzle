import React from 'react';
import { TutorialPrompt } from '../game/tutorial';
import { t } from '../i18n';

interface TutorialBannerProps {
  prompt: TutorialPrompt;
  onSkip: () => void;
}

export const TutorialBanner: React.FC<TutorialBannerProps> = ({ prompt, onSkip }) => (
  <div
    data-testid="tutorial-banner"
    className="ui-btn !cursor-default !font-normal !whitespace-normal w-full max-w-[min(94vw,460px)] sm:max-w-[512px] px-2 py-0.5 sm:px-2.5 sm:py-1 text-left flex items-center sm:items-start justify-between gap-2.5 sm:gap-3"
  >
    <div className="space-y-0.5 min-w-0">
      <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#D4002A] truncate">
        {t(prompt.titleSv)}
      </div>
      <p className="text-[11px] sm:text-sm font-semibold text-[#111111] leading-tight sm:leading-snug line-clamp-3 sm:line-clamp-none">
        {t(prompt.instructionSv)}
      </p>
    </div>
    <button
      type="button"
      data-testid="tutorial-skip"
      onClick={onSkip}
      className="ui-btn ui-btn-wood shrink-0 px-1.5 text-[11px] sm:text-xs"
    >
      {t('Hoppa över')}
    </button>
  </div>
);
