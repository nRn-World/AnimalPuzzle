import React, { useEffect, useState } from 'react';
import { AchievementSaveState } from '../game/achievements';
import { ANIMAL_SKINS, DailyChallenge, SEASONAL_SKINS, SKIN_SOURCE, getSkinMeta } from '../game/daily';
import {
  CAMPAIGN_CHAPTER_COUNT,
  DIFFICULTY_META,
  LEVELS_PER_CHAPTER,
  chapterOfLevelIdx,
  getCampaignLevel,
  getChapter,
} from '../game/levels';
import { LevelDifficulty } from '../game/types';
import { getStarThresholds } from '../game/mastery';
import { AnimalSkinId, GameMode } from '../game/types';
import { SavedGame } from '../game/savedGame';
import { formatNumber, t } from '../i18n';
import { AchievementsModal, TitleAchievementsSummary } from './AchievementsSection';
import { StarRating } from './StarRating';
import titleBackdrop from '../assets/images/title-backdrop.webp';
import { WorkshopFireCanvas } from './WorkshopFireCanvas';
import { CollectionModal } from './CollectionModal';
import { HUB_TABS, HubModal, HubTab } from './HubModal';
import { StoryModal } from './StoryModal';
import { IslandState, totalStars } from '../game/island';
import { Mission, MissionState, missionsDone } from '../game/missions';
import { BLITZ_SECONDS, BlitzState, PlayStats } from '../game/stats';
import { StoryPage } from '../game/story';
import { WEEKLY_LEVEL_ENERGY, WeeklyLevelState } from '../game/weeklyLevel';
import { GemColor, LevelConfig } from '../game/types';
import { biomeName, biomeOfChapter } from '../game/biomes';
import { HeartIcon } from './GameModals';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import {
  LivesState,
  MAX_LIVES,
  REFILL_COST,
  formatCountdown,
  msToNextLife,
  settleLives,
} from '../game/lives';
import { ActiveSeason, SEASON_TARGET, getNextSeason } from '../game/seasons';
import { GemSvg } from './GemSvg';
import { GEM_META } from '../game/types';
import {
  RewardState,
  WEEKLY_REWARD_ENERGY,
  WEEKLY_SKIN,
  WeeklyQuest,
  currentStreak,
  seasonProgress,
  streakBonus,
  weeklyProgress,
} from '../game/rewards';
import { SagaMap } from './SagaMap';
import { UiIcon, UiIconName } from './UiIcon';

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
  rewardState: RewardState;
  weeklyQuest: WeeklyQuest;
  todayKey: string;
  lives: LivesState;
  onBuyLives: () => void;
  missions: Mission[];
  missionState: MissionState;
  companion: GemColor;
  onSelectCompanion: (color: GemColor) => void;
  island: IslandState;
  onBuild: () => void;
  onCollectGift: () => void;
  weeklyLevel: LevelConfig;
  weeklyLevelState: WeeklyLevelState;
  onStartWeekly: () => void;
  stats: PlayStats;
  blitz: BlitzState;
  storyPage: StoryPage | null;
  onCloseStory: () => void;
  onReadStory: (id: string) => void;
  seenPages: string[];
  /** The seasonal event running now, if any. */
  season: ActiveSeason | null;
  isFullscreen?: boolean;
  canFullscreen?: boolean;
  /** True while another dialog (guide, settings) covers the menu. */
  guideOpen?: boolean;
  /** A run that can be continued, or null. */
  savedGame: SavedGame | null;
  onResumeSaved: () => void;
  onOpenSettings: () => void;
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
  party: 'text-[#FF8AA8]',
  explorer: 'text-[#E0BC43]',
  santa: 'text-[#FF6B7D]',
  easter: 'text-[#F9A8D4]',
  summer: 'text-[#FDBA74]',
};

const MODE_TABS: { mode: GameMode; label: string; icon: UiIconName }[] = [
  { mode: 'campaign', label: 'Kampanj', icon: 'flag' },
  { mode: 'daily', label: 'Daglig', icon: 'target' },
  { mode: 'endless', label: 'Oändligt', icon: 'trophy' },
  { mode: 'blitz', label: 'Tid', icon: 'power' },
];

// Difficulty badge colours that read well on the parchment panel
const DIFFICULTY_BADGE: Record<LevelDifficulty, string> = {
  easy: 'border-[#111111] bg-[#A6EC98] text-[#111111]',
  medium: 'border-[#111111] bg-[#F2D23C] text-[#111111]',
  hard: 'border-[#111111] bg-[#FF9DAD] text-[#111111]',
  extreme: 'border-[#111111] bg-[#D9B3FF] text-[#111111]',
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

const PrismButterflyMark: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="58 68 396 388" className={className} aria-hidden="true">
    <g strokeLinejoin="round">
      <path
        d="M248 126C230 101 207 89 189 88M264 126C282 101 305 89 323 88"
        fill="none"
        stroke="#F5B841"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle cx="185" cy="87" r="8" fill="#FDE68A" stroke="#07111B" strokeWidth="4" />
      <circle cx="327" cy="87" r="8" fill="#FDE68A" stroke="#07111B" strokeWidth="4" />

      <path
        d="M244 240C207 207 169 141 106 116C70 168 84 244 134 276C171 298 216 286 244 270Z"
        fill="#F43F5E"
        stroke="#07111B"
        strokeWidth="11"
      />
      <path
        d="M268 240C305 207 343 141 406 116C442 168 428 244 378 276C341 298 296 286 268 270Z"
        fill="#F59E0B"
        stroke="#07111B"
        strokeWidth="11"
      />
      <path
        d="M242 282C200 289 141 322 126 379C143 422 198 426 234 392C253 370 252 326 246 299Z"
        fill="#10B981"
        stroke="#07111B"
        strokeWidth="11"
      />
      <path
        d="M270 282C312 289 371 322 386 379C369 422 314 426 278 392C259 370 260 326 266 299Z"
        fill="#38BDF8"
        stroke="#07111B"
        strokeWidth="11"
      />

      <path d="M232 250C202 223 174 167 124 144C103 181 116 229 154 251C180 266 212 261 232 250Z" fill="#FDA4AF" opacity="0.55" />
      <path d="M280 250C310 223 338 167 388 144C409 181 396 229 358 251C332 266 300 261 280 250Z" fill="#FDE68A" opacity="0.55" />
      <path d="M233 300C199 307 155 334 144 371C158 400 192 406 218 380C232 364 236 326 233 300Z" fill="#6EE7B7" opacity="0.5" />
      <path d="M279 300C313 307 357 334 368 371C354 400 320 406 294 380C280 364 276 326 279 300Z" fill="#93C5FD" opacity="0.5" />

      <path
        d="M256 154C275 191 278 243 268 287L256 385L244 287C234 243 237 191 256 154Z"
        fill="#F5B841"
        stroke="#07111B"
        strokeWidth="8"
      />
      <path d="M256 170C265 200 267 235 262 265L256 330L250 265C245 235 247 200 256 170Z" fill="#FFF1C2" opacity="0.3" />
      <circle cx="256" cy="151" r="26" fill="#F5B841" stroke="#07111B" strokeWidth="7" />
      <circle cx="247" cy="149" r="3" fill="#07111B" />
      <circle cx="265" cy="149" r="3" fill="#07111B" />
      <path d="M250 158Q256 163 262 158" fill="none" stroke="#07111B" strokeWidth="3" strokeLinecap="round" />
      <path d="M246 215H266M244 260H268M247 305H265" stroke="#8A5405" strokeWidth="3" opacity="0.4" />
    </g>
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
  if (skin === 'party') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <path d="M12 2.5 L19 20 H5 Z" />
        <circle cx="12" cy="3" r="2.2" />
      </svg>
    );
  }
  if (skin === 'explorer') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <path d="M6.5 15 C6.5 8.5 9 6 12 6 C15 6 17.5 8.5 17.5 15 Z" />
        <ellipse cx="12" cy="16" rx="10" ry="2.6" />
      </svg>
    );
  }
  if (skin === 'santa') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <path d="M5 17 C6 9 10 5 15 4 C18 6 20 9 20.5 12 L17 11 C17 13 17.5 15 18 17 Z" />
        <rect x="3.5" y="16.5" width="16" height="4" rx="2" />
        <circle cx="20.5" cy="13" r="2.2" />
      </svg>
    );
  }
  if (skin === 'easter') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <ellipse cx="8.5" cy="8" rx="2.6" ry="6.5" transform="rotate(-10 8.5 8)" />
        <ellipse cx="15.5" cy="8" rx="2.6" ry="6.5" transform="rotate(10 15.5 8)" />
        <circle cx="12" cy="17" r="5" />
      </svg>
    );
  }
  if (skin === 'summer') {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
        <rect x="2.5" y="9" width="8" height="6.5" rx="2.6" />
        <rect x="13.5" y="9" width="8" height="6.5" rx="2.6" />
        <rect x="10" y="10" width="4" height="1.8" />
      </svg>
    );
  }
  return <PrismButterflyMark className={className} />;
};

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
  rewardState,
  weeklyQuest,
  todayKey,
  lives,
  onBuyLives,
  missions,
  missionState,
  companion,
  onSelectCompanion,
  island,
  onBuild,
  onCollectGift,
  weeklyLevel,
  weeklyLevelState,
  onStartWeekly,
  stats,
  blitz,
  storyPage,
  onCloseStory,
  onReadStory,
  seenPages,
  season,
  isFullscreen = false,
  canFullscreen = false,
  guideOpen = false,
  savedGame,
  onResumeSaved,
  onOpenSettings,
  onSelectMode,
  onSelectLevel,
  onEquipSkin,
  onToggleFullscreen,
  onStart,
  onShowGuide,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [hubTab, setHubTab] = useState<HubTab | null>(null);
  const { canInstall, install } = useInstallPrompt();
  // Tick once a second while a life is on its way back.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (lives.lives >= MAX_LIVES) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lives.lives]);
  const livesNow = settleLives(lives, now);
  const outOfLives = mode === 'campaign' && livesNow.lives <= 0;
  const seasonNow = season ? seasonProgress(rewardState, season.key) : { progress: 0, claimed: false };
  const nextSeason = getNextSeason();
  const weekly = weeklyProgress(rewardState, weeklyQuest.weekKey);
  const weeklyShown = Math.min(weeklyQuest.target, weekly.progress);
  const streak = currentStreak(rewardState, todayKey);
  // What the next daily win adds on top of the normal reward.
  const nextStreakBonus = streakBonus(streak + 1);
  const [chapterId, setChapterId] = useState<number>(
    () => chapterOfLevelIdx(selectedLevelIdx)
  );

  // Keep the chapter picker in sync when a level from another chapter gets selected
  useEffect(() => {
    setChapterId(chapterOfLevelIdx(selectedLevelIdx));
  }, [selectedLevelIdx]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (achievementsOpen || collectionOpen || hubTab || storyPage || guideOpen) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'BUTTON') return;
        e.preventDefault();
        onStart();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [achievementsOpen, collectionOpen, guideOpen, hubTab, onStart, storyPage]);

  const currentLevel = getCampaignLevel(selectedLevelIdx);
  const featuredSkinMeta = getSkinMeta(dailyChallenge.featuredSkin);
  const difficultyMeta = DIFFICULTY_META[currentLevel.difficulty ?? 'medium'];
  const starThresholds = getStarThresholds(currentLevel.moves);
  const chapter = getChapter(chapterId);
  // The furthest chapter the player may look at: the one they are playing in.
  const latestChapterId = chapterOfLevelIdx(highestUnlockedIdx);

  const savedLevel =
    savedGame?.mode === 'campaign' ? getCampaignLevel(savedGame.levelIdx) : null;
  const savedTitle = !savedGame
    ? ''
    : savedGame.mode === 'campaign' && savedLevel
    ? t('Nivå {n} · {name}', { n: savedLevel.id, name: t(savedLevel.name) })
    : savedGame.mode === 'daily'
    ? t('Daglig utmaning')
    : t('Oändligt läge');

  const goToChapter = (id: number) => {
    const next = Math.min(latestChapterId, Math.max(1, id));
    if (next === chapterId) return;
    setChapterId(next);
    const firstIdx = (next - 1) * LEVELS_PER_CHAPTER;
    // Land on the newest unlocked level of that chapter.
    onSelectLevel(Math.min(highestUnlockedIdx, firstIdx + LEVELS_PER_CHAPTER - 1));
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
              alt=""
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
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B101A]/70 via-[#0B101A]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B101A]/60 via-transparent to-[#0B101A]/30" />

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
          <div className="ui-menu-fit relative w-full max-w-[600px] lg:max-w-[1010px] animate-menu-pop">
            <h1 lang="en" className="ui-title relative z-10 mb-3 sm:mb-4 text-center lg:text-left lg:pl-6 text-[clamp(2.6rem,14vw,3.6rem)] sm:text-[4.25rem]">
              AnimalPuzzle
            </h1>

            {/* Lives: campaign levels cost one when you fail */}
            <div
              data-testid="lives"
              role="img"
              aria-label={t('{n} av {max} liv', { n: livesNow.lives, max: MAX_LIVES })}
              className="ui-lives relative z-10 mx-auto mb-2 flex w-fit items-center gap-1 border-[3px] border-[#111111] bg-[var(--ui-paper)] px-2 py-1 shadow-[3px_3px_0_#111111] lg:absolute lg:right-12 lg:top-2 lg:mb-0"
            >
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <HeartIcon key={i} className="h-5 w-5" empty={i >= livesNow.lives} />
              ))}
              {livesNow.lives < MAX_LIVES && (
                <span className="ml-1 font-mono-num text-xs font-extrabold text-[#111111]">
                  {formatCountdown(msToNextLife(livesNow, now))}
                </span>
              )}
            </div>

            <div className="ui-panel relative px-2.5 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4">
              {canFullscreen && onToggleFullscreen && (
                <button
                  type="button"
                  data-testid="title-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-pressed={isFullscreen}
                  title={isFullscreen ? t('Avsluta hel skärm') : t('Hel skärm')}
                  aria-label={isFullscreen ? t('Avsluta hel skärm') : t('Visa i hel skärm')}
                  className="ui-btn ui-btn-yellow absolute -right-2 -top-5 z-10 h-8 w-8 !border-[3px]"
                >
                  <UiIcon name={isFullscreen ? 'smaller' : 'larger'} className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Wide screens: two columns so the whole menu fits without scrolling */}
              <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-4">
              <div className="min-w-0">
              {savedGame && (
                <button
                  type="button"
                  data-testid="resume-saved-btn"
                  onClick={onResumeSaved}
                  className="ui-btn ui-btn-yellow mb-2.5 flex w-full !justify-start gap-3 px-2 py-1 text-left"
                >
                  <UiIcon name="right" className="w-5 h-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-extrabold uppercase tracking-wider">
                      {t('Fortsätt där du slutade')}
                    </span>
                    <span className="block truncate text-xs sm:text-[13px] font-bold">
                      {savedTitle}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono-num text-[10px] sm:text-[11px] font-bold">
                    <span className="block">
                      {t('{n} drag kvar', { n: savedGame.movesLeft })}
                    </span>
                    <span className="block">
                      {t('{score} poäng', { score: formatNumber(savedGame.progress.score) })}
                    </span>
                  </span>
                </button>
              )}

              {/* Mode switch */}
              <div role="tablist" aria-label={t('Spelläge')} className="flex items-stretch gap-1.5">
                {MODE_TABS.map((tab) => {
                  const active = mode === tab.mode;
                  return (
                    <button
                      key={tab.mode}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => onSelectMode(tab.mode)}
                      className={`ui-btn flex-1 !gap-1.5 px-1 text-[11px] sm:text-[13px] ${
                        active ? 'ui-btn-wood py-0.5' : 'py-1.5'
                      }`}
                    >
                      <UiIcon name={tab.icon} className="w-3.5 h-3.5" />
                      {t(tab.label)}
                    </button>
                  );
                })}
              </div>

              {mode === 'campaign' && (
                <div className="mt-2.5 space-y-2">
                  {/* Chapter pager: thousands of chapters, one shown at a time */}
                  <div
                    role="group"
                    aria-label={t('Kapitel')}
                    data-testid="chapter-pager"
                    className="flex items-stretch gap-1.5"
                  >
                    <button
                      type="button"
                      onClick={() => goToChapter(chapterId - 1)}
                      disabled={chapterId <= 1}
                      aria-label={t('Föregående kapitel')}
                      className="ui-btn w-9 shrink-0"
                    >
                      <UiIcon name="previous" className="w-3.5 h-3.5" />
                    </button>
                    <div className="min-w-0 flex-1 rounded-sm border-[3px] border-[#111111] bg-[#FF2E4D] px-2 py-1 text-center text-[#FFFFFF]">
                      <div className="truncate text-[9px] font-extrabold uppercase tracking-wider opacity-90">
                        {t('Kapitel {n} av {total}', {
                          n: formatNumber(chapterId),
                          total: formatNumber(CAMPAIGN_CHAPTER_COUNT),
                        })}
                        {' · '}
                        {t(biomeName(biomeOfChapter(chapterId)))}
                      </div>
                      <div className="truncate font-display text-base sm:text-lg leading-tight">
                        {t(chapter.nameSv)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => goToChapter(chapterId + 1)}
                      disabled={chapterId >= latestChapterId}
                      aria-label={t('Nästa kapitel')}
                      className="ui-btn w-9 shrink-0"
                    >
                      <UiIcon name="next" className="w-3.5 h-3.5" />
                    </button>
                    {chapterId !== latestChapterId && (
                      <button
                        type="button"
                        onClick={() => goToChapter(latestChapterId)}
                        aria-label={t('Hoppa till senaste kapitlet')}
                        title={t('Hoppa till senaste kapitlet')}
                        className="ui-btn ui-btn-wood w-9 shrink-0"
                      >
                        <UiIcon name="flag" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <SagaMap
                    highestUnlockedIdx={highestUnlockedIdx}
                    selectedLevelIdx={selectedLevelIdx}
                    bestStars={bestStars}
                    onSelectLevel={onSelectLevel}
                    onChapterInView={setChapterId}
                  />

                  <div className="ui-inset px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                        <UiIcon name="flag" className="w-3 h-3" />
                        <span className="truncate">
                          {t('Nivå {n} · {name}', { n: currentLevel.id, name: t(currentLevel.name) })}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 rounded border-2 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                          DIFFICULTY_BADGE[currentLevel.difficulty ?? 'medium']
                        }`}
                      >
                        {t(difficultyMeta.labelSv)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs sm:text-[13px] font-semibold leading-snug">
                      {t(currentLevel.subtitle)}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <StarRating stars={bestStars[currentLevel.id] ?? 0} size="sm" tone="parchment" />
                        <span className="text-[10px] font-bold text-[#4B4B4B]">
                          {bestStars[currentLevel.id]
                            ? t('Bästa: {n}/3 stjärnor', { n: bestStars[currentLevel.id] })
                            : t('Inte klarad än')}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-[#4B4B4B]">
                        {t('2★ = {two} drag kvar · 3★ = {three} drag kvar', {
                          two: starThresholds.two,
                          three: starThresholds.three,
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'daily' && (
                <div data-testid="daily-challenge-panel" className="ui-inset mt-2.5 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                      <UiIcon name="target" className="w-3.5 h-3.5" />
                      {t(dailyChallenge.title)}
                    </span>
                    <span className="rounded bg-[#111111] px-1.5 py-0.5 text-[10px] font-mono-num font-bold text-[#FFFFFF]">
                      {dailyChallenge.dateKey}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] font-bold leading-snug">
                    {t('Mål: {goal}', { goal: t(dailyChallenge.goalSummary) })}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    <span className="rounded border-2 border-[#111111] bg-[#F2D23C] px-1.5 py-0.5 text-[#111111]">
                      {t('+{n} bonusenergi', { n: dailyChallenge.rewardEnergy })}
                    </span>
                    <span className="rounded border-2 border-[#111111] px-1.5 py-0.5">
                      {t(featuredSkinMeta.nameSv)}
                    </span>
                    <span
                      className={`rounded border-2 px-1.5 py-0.5 ${
                        dailyCompletedToday
                          ? 'border-[#111111] bg-[#A6EC98] text-[#111111]'
                          : 'border-[#111111] text-[#4B4B4B]'
                      }`}
                    >
                      {dailyCompletedToday ? t('Avklarad idag') : t('Ej klar')}
                    </span>
                  </div>
                  <div
                    data-testid="daily-streak"
                    className="flex items-center gap-1.5 border-t-2 border-dashed border-[#111111]/40 pt-1.5 text-[11px] font-bold"
                  >
                    <UiIcon name="up" className="h-3.5 w-3.5 text-[#D4002A]" />
                    <span>
                      {streak > 0
                        ? t('Svit: {n} dagar i rad', { n: streak })
                        : t('Ingen svit än – klara dagens för att börja')}
                    </span>
                    {nextStreakBonus > 0 && (
                      <span className="ml-auto text-[10px] text-[#4B4B4B]">
                        {t('Nästa dag: +{n} extra', { n: nextStreakBonus })}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {mode === 'daily' && (
                <div data-testid="weekly-level-panel" className="ui-inset mt-2.5 px-3 py-2 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                      <UiIcon name="warning" className="w-3.5 h-3.5" />
                      {t('Veckans specialnivå')}
                    </span>
                    <span
                      className={`rounded border-2 border-[#111111] px-1.5 py-0.5 text-[10px] font-extrabold ${
                        weeklyLevelState.won ? 'bg-[#A6EC98]' : 'bg-[#F2CD1C]'
                      }`}
                    >
                      {weeklyLevelState.won ? t('Klarad') : `+${WEEKLY_LEVEL_ENERGY}`}
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] font-semibold leading-snug">
                    {t('En extra svår nivå som är densamma hela veckan. {moves} drag, och första vinsten ger {n} bonusenergi.', {
                      moves: weeklyLevel.moves,
                      n: WEEKLY_LEVEL_ENERGY,
                    })}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-[#4B4B4B]">
                      {t('Försök den här veckan: {n}', { n: weeklyLevelState.attempts })}
                    </span>
                    <button
                      type="button"
                      data-testid="start-weekly-btn"
                      onClick={onStartWeekly}
                      className="ui-btn ui-btn-yellow px-3 py-1 text-sm"
                    >
                      {t('Anta utmaningen')}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'blitz' && (
                <div data-testid="blitz-panel" className="ui-inset mt-2.5 px-3 py-2 space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                    <UiIcon name="power" className="w-3.5 h-3.5" />
                    {t('Tidsläge · {n} sekunder', { n: BLITZ_SECONDS })}
                  </span>
                  <p className="text-xs sm:text-[13px] font-semibold leading-snug">
                    {t('Inga drag att räkna: samla så många poäng du hinner innan klockan tar slut. Veckans lista börjar om varje måndag.')}
                  </p>
                  <span className="inline-flex rounded bg-[#111111] px-2 py-1 text-[11px] font-mono-num font-bold text-[#FFE14D]">
                    {t('Rekord: {n} poäng', { n: formatNumber(blitz.best) })}
                  </span>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                    {t('Veckans bästa')}
                  </div>
                  {blitz.week.length === 0 ? (
                    <p className="text-xs font-semibold text-[#4B4B4B]">{t('Ingen omgång spelad den här veckan än.')}</p>
                  ) : (
                    <ol className="space-y-1">
                      {blitz.week.map((score, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between border-2 border-[#111111] bg-[#FFFFFF]/70 px-2 py-0.5 text-xs font-extrabold"
                        >
                          <span>{i + 1}.</span>
                          <span className="font-mono-num">{formatNumber(score)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}

              {mode === 'endless' && (
                <div className="ui-inset mt-2.5 px-3 py-2 space-y-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                    <UiIcon name="trophy" className="w-3.5 h-3.5" />
                    {t('Oändligt läge')}
                  </span>
                  <p className="text-xs sm:text-[13px] font-semibold leading-snug">
                    {t('Bygg långa kedjereaktioner, tjäna bonusdrag och slå ditt rekord.')}
                  </p>
                  <span className="inline-flex rounded bg-[#111111] px-2 py-1 text-[11px] font-mono-num font-bold text-[#FFE14D]">
                    {t('Rekord: {n} poäng', { n: formatNumber(bestEndlessScore) })}
                  </span>
                </div>
              )}

              </div>
              <div className="min-w-0">
              {/* Seasonal event: a big hunt with its own skin */}
              {season ? (
                <div data-testid="season-event" className="mt-2.5 mb-2.5 lg:mt-0 border-[3px] border-[#111111] bg-[var(--ui-yellow)] px-2.5 py-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-display text-base leading-tight tracking-wide">
                      {t(season.season.nameSv)}
                    </span>
                    <span className="shrink-0 font-mono-num text-[11px] font-extrabold">
                      {formatNumber(Math.min(SEASON_TARGET, seasonNow.progress))}/{formatNumber(SEASON_TARGET)}
                    </span>
                  </div>
                  <span className="mt-0.5 block h-2.5 w-full border-2 border-[#111111] bg-[#FFFFFF]/60">
                    <span
                      className="block h-full bg-[#FF2E4D]"
                      style={{ width: `${Math.round((Math.min(SEASON_TARGET, seasonNow.progress) / SEASON_TARGET) * 100)}%` }}
                    />
                  </span>
                  <div className="mt-0.5 truncate text-[10px] font-bold">
                    {seasonNow.claimed
                      ? t('Klar! Skinnet {name} är ditt.', { name: t(getSkinMeta(season.season.skin).nameSv) })
                      : t('Samla djur i valfritt läge · {days} dagar kvar · pris: {name}', {
                          days: season.daysLeft,
                          name: t(getSkinMeta(season.season.skin).nameSv),
                        })}
                  </div>
                </div>
              ) : (
                <div data-testid="season-next" className="mt-2.5 mb-1 lg:mt-0 truncate text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Nästa event: {name} om {days} dagar', {
                    name: t(nextSeason.season.nameSv),
                    days: nextSeason.startsInDays,
                  })}
                </div>
              )}
              {/* Weekly hunt: collected in every mode, new animal each Monday */}
              <div data-testid="weekly-hunt" className="ui-inset flex items-center gap-2.5 px-2.5 py-1.5">
                <span className="h-10 w-10 shrink-0">
                  <GemSvg color={weeklyQuest.color} special="none" animationSeed={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                      {t('Veckans jakt')}
                    </span>
                    <span className="shrink-0 font-mono-num text-[11px] font-extrabold">
                      {formatNumber(weeklyShown)}/{formatNumber(weeklyQuest.target)}
                    </span>
                  </div>
                  <span className="mt-0.5 block h-2.5 w-full border-2 border-[#111111] bg-[#FFFFFF]/50">
                    <span
                      className="block h-full bg-[#6FE65E]"
                      style={{ width: `${Math.round((weeklyShown / weeklyQuest.target) * 100)}%` }}
                    />
                  </span>
                  <div className="mt-0.5 text-[10px] font-semibold leading-tight text-[#4B4B4B]">
                    {weekly.claimed
                      ? t('Klar! Ny jakt på måndag.')
                      : unlockedSkins.includes(WEEKLY_SKIN)
                      ? t('Samla {name} i valfritt läge · +{n} energi', {
                          name: t(GEM_META[weeklyQuest.color].nameSv),
                          n: WEEKLY_REWARD_ENERGY,
                        })
                      : t('Samla {name} i valfritt läge · +{n} energi och Kalashattar', {
                          name: t(GEM_META[weeklyQuest.color].nameSv),
                          n: WEEKLY_REWARD_ENERGY,
                        })}
                  </div>
                </div>
              </div>

              {/* Animal skins */}
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                    <PawIcon className="w-3 h-3" />
                    {t('Djur-gäng')}
                  </h2>
                  {bonusEnergyBank > 0 && (
                    <span
                      data-testid="bonus-energy-bank"
                      className="rounded border-2 border-[#111111] bg-[#F2D23C] px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-[#111111]"
                    >
                      {t('+{n} bonusenergi', { n: bonusEnergyBank })}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5" role="group" aria-label={t('Välj djur-skin')}>
                  {ANIMAL_SKINS.filter(
                    (s) => !SEASONAL_SKINS.includes(s.id) || unlockedSkins.includes(s.id)
                  ).map((s) => {
                    const unlocked = unlockedSkins.includes(s.id);
                    const equipped = equippedSkin === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onEquipSkin(s.id)}
                        title={
                          unlocked
                            ? t(s.descSv)
                            : t('Lås upp via daglig utmaning: {name}', { name: t(s.nameSv) })
                        }
                        aria-label={`${t(s.nameSv)}${
                          equipped ? ` ${t('(vald)')}` : unlocked ? '' : ` ${t('(låst)')}`
                        }`}
                        aria-pressed={equipped}
                        className={`ui-btn !justify-start !gap-2 px-1 py-0.5 text-left !font-normal ${
                          equipped ? 'ui-btn-wood' : ''
                        } ${!unlocked ? '!opacity-100' : ''}`}
                      >
                        <span
                          className={`relative inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 shrink-0 ${
                            equipped ? 'border-[#FFE14D] bg-[#111111]' : 'border-[#111111] bg-[#111111]'
                          } ${!unlocked ? 'grayscale opacity-60' : ''}`}
                        >
                          <span className={SKIN_TINT[s.id]}>
                            <SkinEmblem skin={s.id} className="w-6 h-6 sm:w-7 sm:h-7" />
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-[11px] sm:text-xs font-extrabold truncate ${
                              !unlocked ? 'text-[#50545A]' : ''
                            }`}
                          >
                            {t(s.nameSv)}
                          </span>
                          <span
                            className={`block text-[10px] font-semibold truncate ${
                              equipped ? 'text-[#111111]' : 'text-[#50545A]'
                            }`}
                          >
                            {equipped ? t('Aktiv') : unlocked ? t('Upplåst') : t(SKIN_SOURCE[s.id].text)}
                          </span>
                        </span>
                        {equipped && (
                          <UiIcon name="checkmark" className="hidden sm:inline-block w-4 h-4 text-[#111111]" />
                        )}
                        {!unlocked && <UiIcon name="locked" className="w-3.5 h-3.5 text-[#62666D]" />}
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

              {/* Missions, companion, island, statistics and the album */}
              <div className="mt-2.5 grid grid-cols-5 gap-1.5">
                {HUB_TABS.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    data-testid={`open-hub-${entry.id}`}
                    onClick={() => setHubTab(entry.id)}
                    className="ui-btn relative px-0.5 py-1.5 text-[11px] sm:text-xs"
                  >
                    <span className="truncate">{t(entry.label)}</span>
                    {entry.id === 'missions' && (
                      <span className="absolute -right-1.5 -top-2 border-2 border-[#111111] bg-[#F2CD1C] px-1 font-mono-num text-[10px] font-extrabold leading-tight">
                        {missionsDone(missionState, missions)}/3
                      </span>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  data-testid="open-collection-btn"
                  onClick={() => setCollectionOpen(true)}
                  title={t('Album och topplista')}
                  className="ui-btn px-0.5 py-1.5 text-[11px] sm:text-xs"
                >
                  <span className="truncate">{t('Album')}</span>
                </button>
              </div>

              {/* CTA */}
              <div className="mt-3.5 flex flex-wrap items-stretch gap-2.5">
                <button
                  type="button"
                  data-start="true"
                  onClick={onStart}
                  disabled={outOfLives}
                  className="ui-btn ui-btn-green w-full sm:w-auto sm:flex-1 px-4 py-1.5 font-display text-lg sm:text-xl tracking-wide disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <UiIcon name="right" className="w-5 h-5" />
                  {outOfLives
                    ? t('Nytt liv om {time}', { time: formatCountdown(msToNextLife(livesNow, now)) })
                    : mode === 'daily'
                    ? t('Kör dagens!')
                    : mode === 'endless'
                    ? t('Kör oändligt!')
                    : mode === 'blitz'
                    ? t('Starta klockan!')
                    : t('Spela nu')}
                </button>
                {outOfLives && (
                  <button
                    type="button"
                    data-testid="buy-lives-btn"
                    onClick={onBuyLives}
                    disabled={bonusEnergyBank < REFILL_COST}
                    title={t('Fyll på alla liv för {n} bonusenergi', { n: REFILL_COST })}
                    className="ui-btn ui-btn-yellow w-full sm:w-auto px-2.5 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <HeartIcon className="h-4 w-4" />
                    {t('Fyll på · {n} energi', { n: REFILL_COST })}
                  </button>
                )}

                <div className="flex w-full sm:w-auto gap-2.5">
                  {canInstall && (
                    <button
                      type="button"
                      data-testid="install-btn"
                      onClick={install}
                      title={t('Installera som app')}
                      aria-label={t('Installera som app')}
                      className="ui-btn ui-btn-yellow px-2.5 py-2 text-sm"
                    >
                      <UiIcon name="down" className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="title-guide-btn"
                    onClick={onShowGuide}
                    className="ui-btn flex-1 sm:flex-none px-2.5 py-2 text-sm"
                  >
                    <UiIcon name="question" className="w-4 h-4" />
                    {t('Så spelar du')}
                  </button>
                  <button
                    type="button"
                    data-testid="title-settings-btn"
                    onClick={onOpenSettings}
                    className="ui-btn flex-1 sm:flex-none px-2.5 py-2 text-sm"
                  >
                    <UiIcon name="gear" className="w-4 h-4" />
                    {t('Inställningar')}
                  </button>
                </div>
              </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <HubModal
        tab={hubTab}
        onTab={setHubTab}
        onClose={() => setHubTab(null)}
        skin={equippedSkin}
        missions={missions}
        missionState={missionState}
        rewardState={rewardState}
        companion={companion}
        onSelectCompanion={onSelectCompanion}
        island={island}
        stars={totalStars(bestStars)}
        onBuild={onBuild}
        onCollectGift={onCollectGift}
        todayKey={todayKey}
        stats={stats}
        achievementStats={achievementState.stats}
        blitz={blitz}
        bestEndlessScore={bestEndlessScore}
        levelsCleared={highestUnlockedIdx}
        seenPages={seenPages}
        onReadStory={onReadStory}
      />
      <StoryModal page={storyPage} skin={equippedSkin} onClose={onCloseStory} />
      <CollectionModal
        open={collectionOpen}
        rewardState={rewardState}
        onClose={() => setCollectionOpen(false)}
      />
      <AchievementsModal
        open={achievementsOpen}
        achievementState={achievementState}
        onClose={() => setAchievementsOpen(false)}
      />
    </>
  );
};
