import React, { useEffect } from 'react';
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
  const stroke = unlocked ? '#FDE047' : '#94A3B8';
  const accent = unlocked ? '#F59E0B' : '#475569';

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
      aria-label="Utmärkelser"
      data-testid="title-achievements-card"
      className="bg-[#161C29]/95 border border-white/15 border-b-[4px] border-b-[#0A0E16] rounded-xl p-3 space-y-2.5 shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FDE047]">
            Utmärkelser
          </span>
          <span aria-hidden="true" className="text-[#64748B]">
            ·
          </span>
          <span
            data-testid="achievements-count"
            className="text-xs font-mono-num font-semibold text-[#E2E8F0]"
          >
            {unlockedCount}/{totalCount} upplåsta
          </span>
        </div>

        <button
          type="button"
          data-testid="open-achievements-btn"
          onClick={onOpenModal}
          className="px-2.5 py-1 text-xs font-bold text-white bg-[#232D42] hover:bg-[#2E3B56] rounded-lg border border-white/15 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Visa alla ({totalCount})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {featured.map((def) => {
          const prog = getAchievementProgress(def, achievementState);
          return (
            <div
              key={def.id}
              data-testid={`achievement-preview-${def.id}`}
              className={`rounded-lg px-2.5 py-2 border ${
                prog.unlocked
                  ? 'bg-[#262116] border-[#F5B841]/55'
                  : 'bg-[#111622] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AchievementIconSvg kind={def.icon} unlocked={prog.unlocked} className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold text-white truncate">{def.titleSv}</span>
                </div>
                <span
                  className={`text-[11px] font-mono-num font-bold shrink-0 ${
                    prog.unlocked ? 'text-[#34D399]' : 'text-[#CBD5E1]'
                  }`}
                >
                  {prog.unlocked
                    ? 'Klar'
                    : `${prog.current.toLocaleString('sv-SE')}/${prog.target.toLocaleString('sv-SE')}`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#090D16] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    prog.unlocked ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070A10]/85"
    >
      <div className="w-full max-w-2xl max-h-[86vh] flex flex-col bg-gradient-to-b from-[#1A2233] to-[#121723] border border-white/15 border-b-[6px] border-b-[#080B12] rounded-2xl shadow-[0_28px_64px_rgba(0,0,0,0.85)] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/10">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#FDE047]">
              Progression · {unlockedCount} av {totalCount} upplåsta
            </div>
            <h2
              id="achievements-modal-title"
              className="font-display text-xl font-bold text-white"
            >
              Alla utmärkelser
            </h2>
          </div>

          <button
            type="button"
            data-testid="close-achievements-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-[#253047] hover:bg-[#31405E] rounded-lg border border-white/15 border-b-[3px] border-b-[#0D1320] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Stäng
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((def) => {
            const prog = getAchievementProgress(def, achievementState);
            return (
              <div
                key={def.id}
                data-testid={`achievement-item-${def.id}`}
                data-unlocked={prog.unlocked ? 'true' : 'false'}
                className={`rounded-xl p-3.5 border border-b-[3px] flex flex-col justify-between gap-2.5 ${
                  prog.unlocked
                    ? 'bg-[#262116] border-[#F5B841]/70 border-b-[#785109]'
                    : 'bg-[#141A27] border-white/12 border-b-[#090C14]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                      prog.unlocked
                        ? 'bg-[#362B16] border-[#F5B841]/60'
                        : 'bg-[#1B2335] border-white/10'
                    }`}
                  >
                    <AchievementIconSvg kind={def.icon} unlocked={prog.unlocked} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{def.titleSv}</h3>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          prog.unlocked ? 'text-[#34D399]' : 'text-[#FDE047]'
                        }`}
                      >
                        {prog.unlocked ? 'Upplåst' : `+${def.rewardEnergy} energi`}
                      </span>
                    </div>
                    <p className="text-xs text-[#CBD5E1] leading-snug mt-0.5">{def.descSv}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono-num">
                    <span className="text-[#CBD5E1]">Framsteg</span>
                    <span className={prog.unlocked ? 'text-[#34D399] font-bold' : 'text-white font-semibold'}>
                      {prog.current.toLocaleString('sv-SE')} / {prog.target.toLocaleString('sv-SE')}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#090D16] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        prog.unlocked ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
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
      className="pointer-events-none fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[min(92vw,380px)] bg-gradient-to-b from-[#292214] to-[#1A160E] border-2 border-[#F5B841] border-b-[4px] border-b-[#785109] rounded-xl px-4 py-3 shadow-[0_18px_40px_rgba(0,0,0,0.85)] flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-[#3A2E17] border border-[#F5B841]/60 flex items-center justify-center shrink-0">
        <AchievementIconSvg kind={achievement.icon} unlocked={true} className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#FDE047]">
          Utmärkelse upplåst · +{achievement.rewardEnergy} energi
        </div>
        <div className="text-sm font-bold text-white truncate">{achievement.titleSv}</div>
      </div>
    </div>
  );
};
