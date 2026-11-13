import React, { useEffect, useState } from 'react';
import { AchievementSaveState } from '../game/achievements';
import { ANIMAL_SKINS, DailyChallenge, getSkinMeta } from '../game/daily';
import { CAMPAIGN_CHAPTERS, CAMPAIGN_LEVELS, DIFFICULTY_META } from '../game/levels';
import { getStarThresholds } from '../game/mastery';
import { AnimalSkinId, GameMode } from '../game/types';
import titleBackdrop from '../assets/images/kromatik_title_bg_1794575671537.jpg';
import { AchievementsModal, TitleAchievementsSummary } from './AchievementsSection';
import { StarRating } from './StarRating';
import { WorkshopFireCanvas } from './WorkshopFireCanvas';

interface TitleScreenProps {
  mode: GameMode;
  selectedLevelIdx: number;
  highestUnlockedIdx: number;
  bestStars: Record<number, number>;
  bestEndlessScore: number;
  dailyChallenge: DailyChallenge;
  dailyCompletedToday: boolean;
  bonusEnergyBank: number;
  unlockedSkins: AnimalSkinId[];
  equippedSkin: AnimalSkinId;
  achievementState: AchievementSaveState;
  isFullscreen?: boolean;
  canFullscreen?: boolean;
  guideOpen?: boolean;
  onSelectMode: (mode: GameMode) => void;
  onSelectLevel: (idx: number) => void;
  onEquipSkin: (skin: AnimalSkinId) => void;
  onToggleFullscreen?: () => void;
  onStart: () => void;
  onShowGuide: () => void;
}

// The menu only shows the skin emblem so the animal roster stays a surprise in-game
const SKIN_TINT: Record<AnimalSkinId, string> = {
  classic: 'text-[#6EE7B7]',
  royal: 'text-[#FDE047]',
  winter: 'text-[#7DD3FC]',
  starlight: 'text-[#D8B4FE]',
};

const FIREFLIES = [
  { left: 55, top: 12, size: 3, delay: 0, duration: 6800 },
  { left: 63, top: 34, size: 2, delay: 900, duration: 7400 },
  { left: 72, top: 22, size: 3, delay: 1800, duration: 6200 },
  { left: 80, top: 46, size: 2, delay: 400, duration: 8200 },
  { left: 88, top: 18, size: 3, delay: 2400, duration: 7000 },
  { left: 93, top: 62, size: 2, delay: 1300, duration: 7800 },
  { left: 68, top: 70, size: 2, delay: 3000, duration: 6600 },
  { left: 47, top: 82, size: 3, delay: 2200, duration: 8600 },
  { left: 36, top: 62, size: 2, delay: 700, duration: 9000 },
  { left: 12, top: 30, size: 2, delay: 1600, duration: 8000 },
  { left: 26, top: 88, size: 3, delay: 2800, duration: 7200 },
  { left: 84, top: 86, size: 2, delay: 500, duration: 8400 },
];

const PawIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <ellipse cx="7" cy="7.4" rx="2.1" ry="2.7" />
    <ellipse cx="17" cy="7.4" rx="2.1" ry="2.7" />
    <ellipse cx="3.6" cy="12.4" rx="1.9" ry="2.3" />
    <ellipse cx="20.4" cy="12.4" rx="1.9" ry="2.3" />
    <path d="M12 10.4c3.2 0 5.6 2.2 5.6 4.6 0 2.4-2 3.8-5.6 3.8s-5.6-1.4-5.6-3.8c0-2.4 2.4-4.6 5.6-4.6z" />
  </svg>
);

const SparkleIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2.4l2.2 6.1 6.1 2.2-6.1 2.2L12 19l-2.2-6.1L3.7 10.7l6.1-2.2z" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="5" y="10.5" width="14" height="10" rx="3" fill="currentColor" fillOpacity="0.25" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

const PlayIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M8.4 5.2c0-1 1.1-1.6 1.9-1.1l8.2 5.7c.8.5.8 1.7 0 2.2L10.3 18c-.8.5-1.9-.1-1.9-1.1z" />
  </svg>
);

const FlagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M6 21V4m0 0l5.2 2.4L17 4l1.6 9.4L11 15 6 12.6" fill="currentColor" fillOpacity="0.22" />
  </svg>
);

const SunIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4.4" fill="currentColor" fillOpacity="0.3" />
    <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
  </svg>
);

const InfinityIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8.4 17.8c2.2 0 3-1.4 3.6-2.6.6-1.2 1.4-2.6 3.6-2.6a3.4 3.4 0 0 0 0-6.8c-2.2 0-3 1.4-3.6 2.6-.6 1.2-1.4 2.6-3.6 2.6a3.4 3.4 0 0 1 0-6.8c2.2 0 3 1.4 3.6 2.6.6 1.2 1.4 2.6 3.6 2.6" />
  </svg>
);

const PrismMark: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="title-medallion-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF1C2" />
        <stop offset="55%" stopColor="#F5B841" />
        <stop offset="100%" stopColor="#C87A12" />
      </linearGradient>
    </defs>
    <polygon
      points="32,5 57,21 48,53 16,53 7,21"
      fill="#141B29"
      stroke="url(#title-medallion-grad)"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
    <polygon points="32,12 49,23 32,34 15,23" fill="#E13B55" fillOpacity="0.95" />
    <polygon points="15,23 32,34 20,49" fill="#2C82F6" fillOpacity="0.95" />
    <polygon points="49,23 44,49 32,34" fill="#19B87A" fillOpacity="0.95" />
    <polygon points="20,49 32,34 44,49" fill="#F29D26" fillOpacity="0.96" />
    <circle cx="32" cy="34" r="4.6" fill="#FFF8DC" />
    <circle cx="30.4" cy="32.4" r="1.5" fill="#FFFFFF" />
  </svg>
);

const CrownEmblem: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M3 7.5l4.8 3L12 4l4.2 6.5 4.8-3-1.5 10.5h-15z"
      fill="currentColor"
      stroke="#0F1219"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <rect x="4.2" y="18.2" width="15.6" height="2.6" rx="1.3" fill="currentColor" stroke="#0F1219" strokeWidth="1.2" />
  </svg>
);

const SnowflakeEmblem: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M12 6l-2.5-2.5M12 6l2.5-2.5M12 18l-2.5 2.5M12 18l2.5 2.5" />
  </svg>
);

const StarEmblem: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5L2.6 9.4l6.5-.9z"
      fill="currentColor"
      stroke="#0F1219"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

const SkinEmblem: React.FC<{ skin: AnimalSkinId; className?: string }> = ({
  skin,
  className = 'w-6 h-6',
}) => {
  if (skin === 'royal') return <CrownEmblem className={className} />;
  if (skin === 'winter') return <SnowflakeEmblem className={className} />;
  if (skin === 'starlight') return <StarEmblem className={className} />;
  return <PrismMark className={className} />;
};

const Shell: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`rounded-2xl border border-white/10 bg-[#111A29]/85 px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${className}`}
  >
    {children}
  </div>
);

export const TitleScreen: React.FC<TitleScreenProps> = ({
  mode,
  selectedLevelIdx,
  highestUnlockedIdx,
  bestStars,
  bestEndlessScore,
  dailyChallenge,
  dailyCompletedToday,
  bonusEnergyBank,
  unlockedSkins,
  equippedSkin,
  achievementState,
  isFullscreen = false,
  canFullscreen = false,
  guideOpen = false,
  onSelectMode,
  onSelectLevel,
  onEquipSkin,
  onToggleFullscreen,
  onStart,
  onShowGuide,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [chapterId, setChapterId] = useState<number>(
    () => CAMPAIGN_LEVELS[selectedLevelIdx]?.chapter ?? 1
  );

  // Keep the chapter picker in sync when a level from another chapter gets selected
  useEffect(() => {
    setChapterId(CAMPAIGN_LEVELS[selectedLevelIdx]?.chapter ?? 1);
  }, [selectedLevelIdx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (achievementsOpen || guideOpen) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'BUTTON') return;
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [achievementsOpen, guideOpen, onStart]);

  const currentLevel = CAMPAIGN_LEVELS[selectedLevelIdx] ?? CAMPAIGN_LEVELS[0];
  const featuredSkinMeta = getSkinMeta(dailyChallenge.featuredSkin);
  const difficultyMeta = DIFFICULTY_META[currentLevel.difficulty ?? 'medium'];
  const starThresholds = getStarThresholds(currentLevel.moves);
  const chapterLevels = CAMPAIGN_LEVELS.map((lvl, idx) => ({ lvl, idx })).filter(
    ({ lvl }) => (lvl.chapter ?? 1) === chapterId
  );

  const handleChapterSelect = (id: number, firstIdx: number) => {
    setChapterId(id);
    const selectedChapter = CAMPAIGN_LEVELS[selectedLevelIdx]?.chapter ?? 1;
    if (selectedChapter !== id && firstIdx >= 0 && firstIdx <= highestUnlockedIdx) {
      onSelectLevel(firstIdx);
    }
  };

  return (
    <>
      {/* Key art with animated fire plus drifting fireflies */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden"
        aria-hidden="true"
      >
        {!imgFailed ? (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-[1376/768] min-w-full min-h-full">
            <img
              src={titleBackdrop}
              alt="Nordisk kristallverkstad med slipade ädelstenar på mörk skiffer"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
            <WorkshopFireCanvas backdropSrc={titleBackdrop} />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#141824] via-[#0F1219] to-[#1B2233]" />
        )}

        {/* Contrast scrims keeping the menu side calm and readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B101A]/96 via-[#0B101A]/82 to-[#0B101A]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B101A]/92 via-transparent to-[#0B101A]/40" />

        {FIREFLIES.map((fly, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-[#FDE68A] animate-menu-firefly"
            style={{
              left: `${fly.left}%`,
              top: `${fly.top}%`,
              width: `${fly.size}px`,
              height: `${fly.size}px`,
              boxShadow: '0 0 10px 2px rgba(253, 224, 71, 0.55)',
              animationDelay: `${fly.delay}ms`,
              animationDuration: `${fly.duration}ms`,
            }}
          />
        ))}
      </div>

      <main className="relative z-10 w-full min-h-[100dvh] overflow-x-hidden bg-transparent flex flex-col justify-between pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <div className="flex-1 flex items-center px-3 sm:px-8 lg:px-16 py-3 sm:py-5">
          <div className="w-full max-w-[620px] animate-menu-pop">
            <div className="relative rounded-[30px] border border-white/12 border-b-[5px] border-b-black/70 bg-gradient-to-b from-[#101828]/94 via-[#0C1320]/92 to-[#0A0F19]/95 p-4 sm:p-6 shadow-[0_28px_70px_rgba(0,0,0,0.6)]">
              <div className="pointer-events-none absolute inset-x-8 -top-px h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
              <div className="pointer-events-none absolute -top-6 left-8 right-16 h-24 rounded-full bg-[#F5B841]/12 blur-2xl" />

              {/* Hero */}
              <div className="relative flex items-center justify-center gap-2.5 sm:gap-3 pr-9 sm:pr-0">
                <div className="relative shrink-0">
                  <span className="absolute -inset-3 rounded-full bg-[#F5B841]/20 blur-lg" />
                  <div className="relative w-12 h-12 sm:w-[62px] sm:h-[62px] rounded-[20px] bg-gradient-to-b from-[#1E2A42] to-[#111827] border border-white/15 flex items-center justify-center animate-menu-float">
                    <PrismMark className="w-9 h-9 sm:w-11 sm:h-11" />
                  </div>
                  <SparkleIcon className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-[#FDE68A] animate-menu-twinkle" />
                  <SparkleIcon className="absolute -bottom-1 -left-2 w-2.5 h-2.5 text-[#FDE68A] animate-menu-twinkle" />
                </div>

                <div className="min-w-0 text-center">
                  <h1 className="font-display text-[clamp(1.3rem,6.4vw,1.55rem)] sm:text-[2.6rem] leading-none tracking-[0.01em] bg-gradient-to-b from-[#FFF8E1] via-[#FDE68A] to-[#E9A23B] bg-clip-text text-transparent drop-shadow-[0_3px_2px_rgba(0,0,0,0.55)]">
                    AnimalPuzzle
                  </h1>
                </div>

                {canFullscreen && onToggleFullscreen && (
                  <button
                    type="button"
                    data-testid="title-fullscreen-btn"
                    onClick={onToggleFullscreen}
                    aria-pressed={isFullscreen}
                    aria-label={isFullscreen ? 'Avsluta hel skärm' : 'Visa i hel skärm'}
                    className="absolute right-0 top-0 shrink-0 inline-flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-2 rounded-full bg-[#182235]/90 hover:bg-[#22304A] border border-white/15 border-b-[3px] border-b-[#080C14] text-[11px] font-bold text-white transition-colors cursor-pointer"
                  >
                    {isFullscreen ? (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FDE047]" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#FDE047]" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    )}
                    <span className="hidden sm:inline">
                      {isFullscreen ? 'Avsluta hel skärm' : 'Hel skärm'}
                    </span>
                  </button>
                )}
              </div>


              {/* Mode switch */}
              <div
                role="tablist"
                aria-label="Spelläge"
                className="mt-3.5 flex items-center gap-1 rounded-full border border-white/12 bg-[#080D17]/85 p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'campaign'}
                  onClick={() => onSelectMode('campaign')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    mode === 'campaign'
                      ? 'bg-gradient-to-b from-[#F7C44B] to-[#D97706] text-[#2C1804] shadow-[0_6px_16px_rgba(217,119,6,0.45)]'
                      : 'text-[#C7D2E1] hover:text-white hover:bg-white/6'
                  }`}
                >
                  <FlagIcon className="w-3.5 h-3.5" />
                  Kampanj
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'daily'}
                  onClick={() => onSelectMode('daily')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    mode === 'daily'
                      ? 'bg-gradient-to-b from-[#F7C44B] to-[#D97706] text-[#2C1804] shadow-[0_6px_16px_rgba(217,119,6,0.45)]'
                      : 'text-[#C7D2E1] hover:text-white hover:bg-white/6'
                  }`}
                >
                  <SunIcon className="w-3.5 h-3.5" />
                  Daglig
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'endless'}
                  onClick={() => onSelectMode('endless')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-[11px] sm:text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                    mode === 'endless'
                      ? 'bg-gradient-to-b from-[#F7C44B] to-[#D97706] text-[#2C1804] shadow-[0_6px_16px_rgba(217,119,6,0.45)]'
                      : 'text-[#C7D2E1] hover:text-white hover:bg-white/6'
                  }`}
                >
                  <InfinityIcon className="w-3.5 h-3.5" />
                  Oändligt
                </button>
              </div>

              {mode === 'campaign' && (
                <div className="mt-2.5 space-y-2">
                  <div
                    role="tablist"
                    aria-label="Kapitel"
                    className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5"
                  >
                    {CAMPAIGN_CHAPTERS.map((ch) => {
                      const firstIdx = CAMPAIGN_LEVELS.findIndex(
                        (l) => (l.chapter ?? 1) === ch.id
                      );
                      const locked = firstIdx < 0 || firstIdx > highestUnlockedIdx;
                      const active = chapterId === ch.id;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          disabled={locked}
                          onClick={() => handleChapterSelect(ch.id, firstIdx)}
                          aria-label={`Kapitel ${ch.id}: ${ch.nameSv}${locked ? ' (låst)' : ''}`}
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold transition-colors ${
                            active
                              ? 'border-[#F5B841]/70 bg-[#2A2113] text-[#FDE047] cursor-pointer'
                              : locked
                              ? 'border-white/8 bg-[#0E1420] text-[#5B6A80] cursor-not-allowed'
                              : 'border-white/12 bg-[#111A29] text-[#9BAAC2] hover:text-white hover:border-white/25 cursor-pointer'
                          }`}
                        >
                          <span className="font-mono-num">{ch.id}</span>
                          {ch.nameSv}
                          {locked && <LockIcon className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Välj nivå">
                    {chapterLevels.map(({ lvl, idx }) => {
                      const locked = idx > highestUnlockedIdx;
                      const active = idx === selectedLevelIdx;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          disabled={locked}
                          onClick={() => onSelectLevel(idx)}
                          aria-label={`Nivå ${lvl.id}: ${lvl.name}${locked ? ' (låst)' : ''}`}
                          className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full font-mono-num text-xs sm:text-sm font-extrabold border-2 transition-all ${
                            active
                              ? 'bg-gradient-to-b from-[#FDE68A] to-[#F5B841] text-[#3B2405] border-white shadow-[0_6px_16px_rgba(245,184,65,0.45)] scale-110 animate-menu-bob cursor-pointer'
                              : locked
                              ? 'bg-[#121926] text-[#5B6A80] border-white/8 cursor-not-allowed'
                              : 'bg-[#1B2436] text-white border-white/15 hover:-translate-y-0.5 hover:border-[#FDE047]/70 cursor-pointer'
                          }`}
                        >
                          {lvl.id}
                          {bestStars[lvl.id] ? (
                            <span
                              aria-hidden="true"
                              className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#FFF8E1] bg-[#F5B841] text-[9px] leading-none text-[#3B2405] shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
                            >
                              ★
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <Shell>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-extrabold uppercase tracking-wider text-[#FDE047]">
                        <FlagIcon className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          Nivå {currentLevel.id} · {currentLevel.name}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${difficultyMeta.badgeClass}`}
                      >
                        {difficultyMeta.labelSv}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-[13px] text-[#DCE4F0] leading-snug">
                      {currentLevel.subtitle}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <StarRating stars={bestStars[currentLevel.id] ?? 0} size="sm" />
                        <span className="text-[10px] font-semibold text-[#9BAAC2]">
                          {bestStars[currentLevel.id]
                            ? `Bästa: ${bestStars[currentLevel.id]}/3 stjärnor`
                            : 'Inte klarad än'}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-[#8FA1B8]">
                        2★ = {starThresholds.two} drag kvar · 3★ = {starThresholds.three} drag kvar
                      </div>
                    </div>
                  </Shell>
                </div>
              )}

              {mode === 'daily' && (
                <div
                  data-testid="daily-challenge-panel"
                  className="mt-2.5 rounded-2xl border border-[#F5B841]/35 bg-gradient-to-br from-[#2A2113]/95 to-[#171208]/95 px-3 py-2.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FDE047]">
                      <SunIcon className="w-3.5 h-3.5" />
                      {dailyChallenge.title}
                    </span>
                    <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-mono-num text-[#E2E8F0]">
                      {dailyChallenge.dateKey}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                    Mål: {dailyChallenge.goalSummary}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="rounded-full bg-[#F5B841]/18 text-[#FDE047] px-2 py-0.5">
                      +{dailyChallenge.rewardEnergy} bonusenergi
                    </span>
                    <span className="rounded-full bg-white/8 text-[#E2E8F0] px-2 py-0.5">
                      {featuredSkinMeta.nameSv}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        dailyCompletedToday
                          ? 'bg-[#10B981]/25 text-[#6EE7B7]'
                          : 'bg-white/8 text-[#CBD5E1]'
                      }`}
                    >
                      {dailyCompletedToday ? 'Avklarad idag' : 'Ej klar'}
                    </span>
                  </div>
                </div>
              )}

              {mode === 'endless' && (
                <div className="mt-2.5 rounded-2xl border border-[#38BDF8]/30 bg-gradient-to-br from-[#101E2E]/95 to-[#0B1420]/95 px-3 py-2.5 space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#7DD3FC]">
                    <InfinityIcon className="w-3.5 h-3.5" />
                    Oändligt läge
                  </span>
                  <p className="text-xs sm:text-[13px] text-[#DCE4F0] leading-snug">
                    Bygg långa kedjereaktioner, tjäna bonusdrag och slå ditt rekord.
                  </p>
                  <span className="inline-flex rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-mono-num text-[#FDE047]">
                    Rekord: {bestEndlessScore.toLocaleString('sv-SE')} poäng
                  </span>
                </div>
              )}

              {/* Animal skins */}
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#C7D2E1]">
                    <PawIcon className="w-3 h-3 text-[#FDE047]" />
                    Djur-gäng
                  </h2>
                  {bonusEnergyBank > 0 && (
                    <span
                      data-testid="bonus-energy-bank"
                      className="rounded-full bg-[#F5B841]/16 px-2 py-0.5 font-mono-num text-[10px] font-bold text-[#FDE047]"
                    >
                      +{bonusEnergyBank} bonusenergi
                    </span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label="Välj djur-skin">
                  {ANIMAL_SKINS.map((s) => {
                    const unlocked = unlockedSkins.includes(s.id);
                    const equipped = equippedSkin === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onEquipSkin(s.id)}
                        title={unlocked ? s.descSv : `Lås upp via daglig utmaning: ${s.nameSv}`}
                        aria-label={`${s.nameSv}${equipped ? ' (vald)' : unlocked ? '' : ' (låst)'}`}
                        aria-pressed={equipped}
                        className={`flex items-center gap-2 rounded-2xl border-2 px-2 py-1.5 text-left transition-all ${
                          equipped
                            ? 'border-[#F5B841] bg-[#2A2113] shadow-[0_8px_18px_rgba(245,184,65,0.22)] cursor-pointer'
                            : unlocked
                            ? 'border-white/12 bg-[#141C2B]/90 hover:-translate-y-0.5 hover:border-white/25 cursor-pointer'
                            : 'border-white/8 bg-[#111725]/80 cursor-not-allowed'
                        }`}
                      >
                        <span
                          className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border shrink-0 ${
                            equipped
                              ? 'border-[#FDE047] bg-[#3A2C14]'
                              : 'border-white/10 bg-[#0C1220]'
                          } ${!unlocked ? 'grayscale opacity-70' : ''}`}
                        >
                          <span className={SKIN_TINT[s.id]}>
                            <SkinEmblem skin={s.id} className="w-6 h-6 sm:w-7 sm:h-7" />
                          </span>
                          {equipped && (
                            <span className="absolute -inset-1.5 rounded-full border border-[#FDE047]/45 animate-menu-twinkle" />
                          )}
                          {!unlocked && (
                            <LockIcon className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-[#94A3B8]" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] sm:text-xs font-bold text-white truncate">
                            {s.nameSv}
                          </span>
                          <span
                            className={`block text-[10px] ${
                              equipped ? 'text-[#FDE047]' : 'text-[#93A4BC]'
                            }`}
                          >
                            {equipped ? 'Aktiv' : unlocked ? 'Upplåst' : 'Lås upp i daglig'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3">
                <TitleAchievementsSummary
                  achievementState={achievementState}
                  onOpenModal={() => setAchievementsOpen(true)}
                />
              </div>

              {/* CTA */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={onStart}
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-[#6EE7B7]/60 border-b-4 border-b-[#065F46] bg-gradient-to-b from-[#34D399] to-[#059669] px-6 sm:px-7 py-3 font-display text-base sm:text-lg font-extrabold tracking-wide text-[#04231A] shadow-[0_12px_26px_rgba(16,185,129,0.35)] transition-transform hover:-translate-y-0.5 active:translate-y-0.5 animate-menu-glow cursor-pointer whitespace-nowrap"
                >
                  <PlayIcon className="w-5 h-5 text-[#043D2B]" />
                  {mode === 'daily' ? 'Kör dagens!' : mode === 'endless' ? 'Kör oändligt!' : 'Spela nu'}
                  <span className="inline-flex gap-0.5 transition-transform group-hover:translate-x-0.5">
                    <SparkleIcon className="w-3 h-3 text-[#065F46]/70" />
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="title-guide-btn"
                  onClick={onShowGuide}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/15 border-b-4 border-b-[#080C14] bg-[#182235]/90 px-5 py-3 text-sm font-extrabold text-[#DCE4F0] transition-colors hover:bg-[#22304A] cursor-pointer"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#FDE047]/60 bg-[#F5B841]/15 text-[11px] font-black text-[#FDE047]"
                  >
                    ?
                  </span>
                  Så spelar du
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>

      <AchievementsModal
        open={achievementsOpen}
        achievementState={achievementState}
        onClose={() => setAchievementsOpen(false)}
      />
    </>
  );
};
