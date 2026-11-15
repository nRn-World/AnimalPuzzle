import React, { useEffect } from 'react';
import { formatNumber, t } from '../i18n';
import { UiIcon } from './UiIcon';
import {
  ACHIEVEMENTS,
  AchievementDef,
  AchievementIconKind,
  AchievementSaveState,
  getAchievementProgress,
} from '../game/achievements';

export const AchievementIconSvg: React.FC<{
  kind: AchievementIconKind;
  unlocked: boolean;
  className?: string;
}> = ({ kind, unlocked, className = 'w-5 h-5' }) => {
  const stroke = unlocked ? '#9A4A12' : '#8C7453';
  const accent = unlocked ? '#E8A317' : '#B79A6C';

  switch (kind) {
    case 'trophy':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M7 4h10v5a5 5 0 0 1-10 0V4z"
            fill={accent}
            fillOpacity="0.28"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 20h8"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'cascade':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M13 2L5 13h6l-1 9 9-12h-6l0-8z"
            fill={accent}
            fillOpacity="0.3"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'ice':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="3"
            fill={unlocked ? '#38BDF8' : '#475569'}
            fillOpacity="0.28"
            stroke={unlocked ? '#7DD3FC' : '#94A3B8'}
            strokeWidth="2"
          />
          <path
            d="M8 9l4 3-4 3M16 9l-4 3 4 3"
            stroke={unlocked ? '#E0F2FE' : '#94A3B8'}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'crate':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2.5"
            fill={accent}
            fillOpacity="0.28"
            stroke={stroke}
            strokeWidth="2"
          />
          <path d="M4 4l16 16M20 4L4 20" stroke={stroke} strokeWidth="1.6" />
        </svg>
      );
    case 'chain':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <path
            d="M10 13a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L11.4 5.9"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M14 11a4 4 0 0 0-5.66 0L5.5 13.83a4 4 0 0 0 5.66 5.66l1.4-1.4"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'special':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <polygon
            points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9"
            fill={accent}
            fillOpacity="0.32"
            stroke={stroke}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'score':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="8.5"
            fill={accent}
            fillOpacity="0.28"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M12 7v10M9 10.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 1.7-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'daily':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15.5"
            rx="2.5"
            fill={accent}
            fillOpacity="0.25"
            stroke={stroke}
            strokeWidth="2"
          />
          <path
            d="M8 3v4M16 3v4M3.5 10h17M9.5 15l1.8 1.8 3.6-3.8"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

interface TitleAchievementsSummaryProps {
  achievementState: AchievementSaveState;
  onOpenModal: () => void;
}

export const TitleAchievementsSummary: React.FC<TitleAchievementsSummaryProps> = ({
  achievementState,
  onOpenModal,
}) => {
  const unlockedCount = achievementState.unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;
  const featured = ACHIEVEMENTS.slice(0, 2);

  return (
    <section
      aria-label={t('Utmärkelser')}
      data-testid="title-achievements-card"
      className="ui-inset p-2.5 space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
            <UiIcon name="trophy" className="w-3.5 h-3.5" />
            {t('Utmärkelser')}
          </span>
          <span aria-hidden="true" className="text-[#6B6F76]">
            ·
          </span>
          <span
            data-testid="achievements-count"
            className="text-[11px] font-mono-num font-bold text-[#4B4B4B]"
          >
            {t('{n}/{total} upplåsta', { n: unlockedCount, total: totalCount })}
          </span>
        </div>

        <button
          type="button"
          data-testid="open-achievements-btn"
          onClick={onOpenModal}
          className="ui-btn shrink-0 px-1.5 py-0.5 text-[11px]"
        >
          {t('Visa alla ({n})', { n: totalCount })}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {featured.map((def) => {
          const prog = getAchievementProgress(def, achievementState);
          return (
            <div
              key={def.id}
              data-testid={`achievement-preview-${def.id}`}
              className={`rounded px-2 py-1.5 border-2 ${
                prog.unlocked
                  ? 'bg-[#F2D23C] border-[#111111]'
                  : 'bg-[#DDE1E7] border-[#111111]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AchievementIconSvg kind={def.icon} unlocked={prog.unlocked} className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-extrabold text-[#111111] truncate">{t(def.titleSv)}</span>
                </div>
                <span
                  className={`text-[11px] font-mono-num font-bold shrink-0 ${
                    prog.unlocked ? 'text-[#0B6B2B]' : 'text-[#4B4B4B]'
                  }`}
                >
                  {prog.unlocked
                    ? t('Klar')
                    : `${formatNumber(prog.current)}/${formatNumber(prog.target)}`}
                </span>
              </div>
              <div className="h-2 w-full rounded-sm border-2 border-[#111111] bg-[#DDE1E7] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    prog.unlocked ? 'bg-[#7CFC6A]' : 'bg-[#FFD91A]'
                  }`}
                  style={{ width: `${prog.pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

interface AchievementsModalProps {
  open: boolean;
  achievementState: AchievementSaveState;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  open,
  achievementState,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const unlockedCount = achievementState.unlockedIds.length;
  const totalCount = ACHIEVEMENTS.length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
      data-testid="achievements-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70"
    >
      <div className="ui-panel w-full max-w-2xl max-h-[86vh] flex flex-col">
        <div className="flex items-center justify-between gap-4 px-2 pb-2 sm:px-3 border-b-2 border-[#111111]">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4002A]">
              {t('Progression · {n} av {total} upplåsta', { n: unlockedCount, total: totalCount })}
            </div>
            <h2
              id="achievements-modal-title"
              className="font-display text-xl font-extrabold"
            >
              {t('Alla utmärkelser')}
            </h2>
          </div>

          <button
            type="button"
            data-testid="close-achievements-btn"
            onClick={onClose}
            className="ui-btn ui-btn-red shrink-0 px-2 py-1 text-xs sm:text-sm"
          >
            {t('Stäng')}
          </button>
        </div>

        <div className="px-2 pt-3 pb-1 sm:px-3 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((def) => {
            const prog = getAchievementProgress(def, achievementState);
            return (
              <div
                key={def.id}
                data-testid={`achievement-item-${def.id}`}
                data-unlocked={prog.unlocked ? 'true' : 'false'}
                className={`rounded p-3 border-2 flex flex-col justify-between gap-2.5 ${
                  prog.unlocked
                    ? 'bg-[#F2D23C] border-[#111111]'
                    : 'bg-[#E2DBB2] border-[#111111]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center shrink-0 border-2 ${
                      prog.unlocked
                        ? 'bg-[#DDE1E7] border-[#111111]'
                        : 'bg-[#DDE1E7] border-[#111111]'
                    }`}
                  >
                    <AchievementIconSvg kind={def.icon} unlocked={prog.unlocked} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-[#111111] truncate">{t(def.titleSv)}</h3>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          prog.unlocked ? 'text-[#0B6B2B]' : 'text-[#D4002A]'
                        }`}
                      >
                        {prog.unlocked ? t('Upplåst') : t('+{n} energi', { n: def.rewardEnergy })}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#4B4B4B] leading-snug mt-0.5">{t(def.descSv)}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono-num">
                    <span className="text-[#4B4B4B]">{t('Framsteg')}</span>
                    <span className={prog.unlocked ? 'text-[#0B6B2B] font-bold' : 'text-[#111111] font-bold'}>
                      {formatNumber(prog.current)} / {formatNumber(prog.target)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-sm border-2 border-[#111111] bg-[#DDE1E7] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        prog.unlocked ? 'bg-[#7CFC6A]' : 'bg-[#FFD91A]'
                      }`}
                      style={{ width: `${prog.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AchievementUnlockToast: React.FC<{
  achievement: AchievementDef | null;
}> = ({ achievement }) => {
  if (!achievement) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="achievement-toast"
      className="ui-panel pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,380px)] px-1 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded bg-[#F2D23C] border-2 border-[#111111] flex items-center justify-center shrink-0">
        <AchievementIconSvg kind={achievement.icon} unlocked={true} className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4002A]">
          {t('Utmärkelse upplåst · +{n} energi', { n: achievement.rewardEnergy })}
        </div>
        <div className="text-sm font-extrabold text-[#111111] truncate">{t(achievement.titleSv)}</div>
      </div>
    </div>
  );
};
