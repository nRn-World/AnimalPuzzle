import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlyingGoalToken } from '../components/FlyingGoalsOverlay';
import { BoardTransitionMode } from '../components/GameBoard';
import { DailyRewardResult } from '../components/GameModals';
import { ParticleCanvasHandle } from '../components/ParticleCanvas';
import {
  AchievementDef,
  AchievementSaveState,
  applyRunEndToAchievements,
  applyStepToAchievements,
  readAchievementState,
  writeAchievementState,
} from '../game/achievements';
import { soundEngine } from '../game/audio';
import {
  addFreeStarter,
  applyStartSpecials,
  canAffordRescue,
  consumeFreeStarters,
  defuseExplodedBombs,
  FreeStarters,
  isRescuableMode,
  MAX_RESCUES_PER_RUN,
  readFreeStarters,
  readWinStreak,
  recordStreakWin,
  RESCUE_MOVES,
  rescueCost,
  resetWinStreak,
  splitRescuePayment,
  StarterId,
  STARTERS,
  starterSelectionCost,
  WinStreakState,
  winStreakSpecials,
  writeFreeStarters,
  writeWinStreak,
} from '../game/boosters';
import {
  CloudConfig,
  fetchGlobalLeaderboard,
  GlobalLeaderboardRow,
  isCloudConfigured,
  LeaderboardBoard,
  PlayerProfile,
  readCloudConfig,
  readPlayerProfile,
  submitGlobalScore,
  writeCloudConfig,
  writePlayerProfile,
} from '../game/cloudSync';
import {
  buildCustomPuzzleBoard,
  CustomPuzzleSpec,
  customPuzzleToLevel,
  customPuzzleUrl,
  parseCustomPuzzleFromSearch,
} from '../game/customPuzzle';
import {
  advanceFever,
  createInitialFever,
  FEVER_DURATION_MOVES,
  feverMultiplier,
  FeverState,
  isFeverActive,
} from '../game/fever';
import {
  applyMasterMode,
  canPlayMasterMode,
  MASTER_FIRST_CLEAR_ENERGY,
  MASTER_LEAGUE_MULTIPLIER,
  MasterCrownsMap,
  readMasterCrowns,
  recordMasterClear,
  writeMasterCrowns,
} from '../game/masterMode';
import {
  addStarRaceStars,
  buildStarRaceStandings,
  claimLavaTrailReward,
  claimStarRaceReward,
  failLavaTrail,
  MiniEventReward,
  MiniEventsState,
  readMiniEvents,
  recordLavaTrailWin,
  startLavaTrail,
  startStarRace,
  writeMiniEvents,
} from '../game/miniEvents';
import {
  addChestStars,
  canSpinWheel,
  openStarChest,
  readStarChestState,
  spinDailyWheel,
  StarChestReward,
  StarChestState,
  WheelSlice,
  writeStarChestState,
} from '../game/starChest';
import {
  claimDailyReward,
  createSeededRng,
  DailySaveState,
  equipAnimalSkin,
  getDailyChallenge,
  getDailyKey,
  grantReward,
  MAX_ENERGY_BANK,
  readDailyState,
  writeDailyState,
} from '../game/daily';
import {
  buildPuzzleBoard,
  DAILY_PUZZLE_REWARD_ENERGY,
  DailyPuzzleSaveState,
  getDailyPuzzle,
  isDailyPuzzleSolved,
  markDailyPuzzleSolved,
  readDailyPuzzleState,
  writeDailyPuzzleState,
} from '../game/dailyPuzzle';
import {
  applyTool,
  areObjectivesComplete,
  canSwap,
  cloneBoard,
  createBoard,
  createEmptyProgress,
  findBestHint,
  levelColorPool,
  resolveSwap,
  clearCells,
  plantBeams,
  getObjectiveCurrent,
} from '../game/engine';
import { vibrate } from '../game/haptics';
import {
  CAMPAIGN_LEVEL_COUNT,
  ENDLESS_CONFIG,
  LEVELS_PER_CHAPTER,
  getCampaignLevel,
} from '../game/levels';
import { mergeBestStars, readBestStars, writeBestStars } from '../game/mastery';
import { addStepDelta } from '../game/progress';
import { BEST_SCORE_STORAGE_KEYS, nextBestScore } from '../game/records';
import {
  CHEST_ENERGY,
  RewardState,
  WEEKLY_REWARD_ENERGY,
  WEEKLY_SKIN,
  addTopScore,
  applyCollected,
  applySeasonCollected,
  getWeekKey,
  getWeeklyQuest,
  openChest,
  readRewardState,
  registerDaily,
  streakBonus,
  writeRewardState,
} from '../game/rewards';
import {
  clearSavedGame,
  isSavedGameResumable,
  readSavedGame,
  SavedGame,
  writeSavedGame,
} from '../game/savedGame';
import {
  applyEndlessMilestones,
  cascadeCheer,
  computeVictoryBonus,
  ENDLESS_MILESTONE_STEP,
} from '../game/scoring';
import { buildShareText, getShareUrl, shareText } from '../game/share';
import { readFlag, readInt, STORAGE_KEYS, writeFlag, writeInt } from '../game/storage';
import {
  createTutorialBoard,
  isMatchingTutorialSwap,
  resolveTutorialPrompt,
  shouldRunTutorial,
  TutorialStepId,
} from '../game/tutorial';
import {
  AnimalSkinId,
  Board,
  ComboType,
  Coord,
  GEM_COLORS_ORDER,
  GemColor,
  GameMode,
  GamePhase,
  LevelConfig,
  LevelProgress,
  SpecialType,
  SwapResult,
  TOOL_COSTS,
  ToolType,
} from '../game/types';
import {
  LivesState,
  MAX_LIVES,
  REFILL_COST,
  loseLife,
  readLives,
  refillLives,
  settleLives,
  writeLives,
} from '../game/lives';
import {
  ActiveSeason,
  SEASON_REWARD_ENERGY,
  SEASON_TARGET,
  forcedSeason,
  getActiveSeason,
} from '../game/seasons';
import { biomeOfChapter } from '../game/biomes';
import { BOSSES, movesUntilBossAttack } from '../game/bosses';
import {
  addLeaguePoints,
  buildLeagueStandings,
  claimLeagueReward,
  LeagueState,
  readLeagueState,
  writeLeagueState,
} from '../game/league';
import {
  detectNewObstacle,
  ObstacleIntroDef,
  ObstacleIntroId,
  readSeenObstacles,
  writeSeenObstacles,
} from '../game/obstacleIntro';
import { prefersReducedMotion } from '../game/settings';
import { WEEKLY_LEVEL_ENERGY, WeeklyLevelState, getWeeklyLevel, readWeeklyLevel, writeWeeklyLevel } from '../game/weeklyLevel';
import {
  animalLevel,
  chargeFrom,
  chargeNeeded,
  getCompanion,
  isCompanionUnlocked,
  powerTargets,
  powerTier,
  TIER_EXTRA_COUNT,
  readCompanion,
  writeCompanion,
} from '../game/companions';
import { BUILD_GIFT, IslandState, build, collectGift, readIsland, totalStars, upgrade, writeIsland } from '../game/island';
import { CalendarState, claimCalendar, readCalendar, writeCalendar } from '../game/calendar';
import { PASS_POINTS, PassState, addPassPoints, claimPass, monthKeyOf, readPass, writePass } from '../game/seasonPass';
import { Challenge, challengeUrl, newChallengeSeed, parseChallenge } from '../game/challenge';
import { QUIP_CASCADE, QUIP_LOW_MOVES, QuipKind, pickQuip } from '../game/quips';
import {
  MissionEvent,
  MissionState,
  applyMissionEvent,
  getDailyMissions,
  readMissionState,
  writeMissionState,
} from '../game/missions';
import {
  BLITZ_SECONDS,
  BlitzState,
  PlayStats,
  addBlitzScore,
  addStats,
  readBlitz,
  readStats,
  writeBlitz,
  writeStats,
} from '../game/stats';
import { STORY_PAGES, StoryPage, bossPage, nextUnseenPage, readSeenPages, writeSeenPages } from '../game/story';
import { formatNumber, Lang, t } from '../i18n';

export const MAX_ENERGY = 100;

export interface EndSnapshot {
  score: number;
  best: number;
  maxCascade: number;
  movesLeft: number;
  bonus: number;
  specialBonus: number;
  stars: number;
  /** Set when this win finished a chapter for the first time. */
  chest?: { energy: number; skin: AnimalSkinId | null };
  /** The level ended because a bomb went off. */
  lostToBomb?: boolean;
  /** Time mode: place on this week's list (0 = outside it). */
  blitzRank?: number;
  /** Time mode played on a friend's challenge: the score that had to be beaten. */
  challengeScore?: number;
  /** Weekly special level: bonus energy paid for the first win of the week. */
  weeklyEnergy?: number;
  /** Daily tactical puzzle: bonus energy paid for today's first solve. */
  puzzleEnergy?: number;
  /** Weekly league points awarded for this round. */
  leaguePoints?: number;
  /** Master Mode first-clear bonus energy (awarded once per level). */
  masterEnergy?: number;
  /** Whether this campaign win was played in Master Mode. */
  masterCleared?: boolean;
}

const EMPTY_SNAPSHOT: EndSnapshot = {
  score: 0,
  best: 0,
  maxCascade: 1,
  movesLeft: 0,
  bonus: 0,
  specialBonus: 0,
  stars: 1,
};

/** True once the boss of a boss level has lost half its health. */
function isBossEnraged(level: LevelConfig, progress: LevelProgress): boolean {
  if (!level.boss) return false;
  const goal = level.objectives.find((o) => o.kind === 'boss');
  return !!goal && getObjectiveCurrent(goal, progress) * 2 >= goal.target;
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** Reads the stored run and drops it if it can no longer be continued. */
function loadResumableSave(highestUnlockedIdx: number, todayKey: string): SavedGame | null {
  const save = readSavedGame();
  if (!save) return null;
  const resumable = isSavedGameResumable(save, {
    levelCount: CAMPAIGN_LEVEL_COUNT,
    highestUnlockedIdx,
    todayKey,
  });
  if (!resumable) {
    clearSavedGame();
    return null;
  }
  return save;
}

/**
 * All game state and rules for one play session: starting and resuming runs,
 * playing out swaps and tools step by step, scoring, rewards and persistence.
 * `language` is only used to rebuild translated level texts when it changes.
 */
export function useGameSession(language: Lang) {
  const [phase, setPhase] = useState<GamePhase>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'PLAYING' : 'TITLE_MENU';
  });

  const [mode, setMode] = useState<GameMode>('campaign');
  /**
   * Seed for the run in progress. Board refills and cascades are drawn from a
   * stream derived from it (plus the move number), so the same seed and the
   * same taps replay the same run. That makes a reported bug reproducible and
   * a submitted score verifiable instead of trusting `Math.random`.
   */
  const [runSeed, setRunSeed] = useState<number>(() => Math.floor(Math.random() * 2 ** 31));
  const runSeedRef = useRef(runSeed);
  useEffect(() => {
    runSeedRef.current = runSeed;
  }, [runSeed]);
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [highestUnlockedIdx, setHighestUnlockedIdx] = useState<number>(() =>
    Math.min(CAMPAIGN_LEVEL_COUNT - 1, Math.max(0, readInt(STORAGE_KEYS.unlocked, 0)))
  );
  const [bestCampaignScore, setBestCampaignScore] = useState<number>(() =>
    readInt(BEST_SCORE_STORAGE_KEYS.campaign, 0)
  );
  const [bestEndlessScore, setBestEndlessScore] = useState<number>(() =>
    readInt(BEST_SCORE_STORAGE_KEYS.endless, 0)
  );
  const [bestDailyScore, setBestDailyScore] = useState<number>(() =>
    readInt(BEST_SCORE_STORAGE_KEYS.daily, 0)
  );

  const [dailyState, setDailyState] = useState<DailySaveState>(() => readDailyState());
  const dailyStateRef = useRef(dailyState);
  dailyStateRef.current = dailyState;
  const todayKey = useMemo(() => getDailyKey(), []);
  // The challenge itself is fixed by the date; only its texts depend on the language.
  const dailyChallenge = useMemo(() => getDailyChallenge(todayKey), [todayKey, language]);
  const dailyCompletedToday = dailyState.completedDates.includes(todayKey);

  // Streak, weekly hunt, chapter chests, album and top list.
  const [rewardState, setRewardState] = useState<RewardState>(() => readRewardState());
  const rewardStateRef = useRef(rewardState);
  const commitRewards = useCallback((next: RewardState) => {
    if (next === rewardStateRef.current) return;
    rewardStateRef.current = next;
    setRewardState(next);
    writeRewardState(next);
  }, []);
  const [lives, setLives] = useState<LivesState>(() => settleLives(readLives(), Date.now()));
  const livesRef = useRef(lives);
  const commitLives = useCallback((next: LivesState) => {
    livesRef.current = next;
    setLives(next);
    writeLives(next);
  }, []);
  /** The seasonal event running today, if any (previewable with ?season=jul). */
  const season = useMemo<ActiveSeason | null>(
    () =>
      (typeof window !== 'undefined' ? forcedSeason(window.location.search) : null) ?? getActiveSeason(),
    []
  );

  const commitDaily = useCallback((next: DailySaveState) => {
    dailyStateRef.current = next;
    setDailyState(next);
    writeDailyState(next);
  }, []);
  const weekKey = useMemo(() => getWeekKey(), []);

  // --- Companion, missions, island, story and statistics ---------------------
  const [companion, setCompanion] = useState<GemColor>(() => readCompanion());
  const [powerCharge, setPowerCharge] = useState<number>(0);
  const skipChargeRef = useRef(false);
  const companionLevel = animalLevel(rewardState.album[companion]).level;
  const powerNeeded = chargeNeeded(companionLevel);

  // The weekly special level and the page shown after a boss falls.
  const weeklyLevel = useMemo(() => getWeeklyLevel(weekKey), [weekKey, language]);
  const [weeklyLevelState, setWeeklyLevelState] = useState<WeeklyLevelState>(() => readWeeklyLevel(weekKey));
  const weeklyLevelRef = useRef(weeklyLevelState);
  const commitWeeklyLevel = useCallback((next: WeeklyLevelState) => {
    weeklyLevelRef.current = next;
    setWeeklyLevelState(next);
    writeWeeklyLevel(next);
  }, []);
  const [bossStory, setBossStory] = useState<StoryPage | null>(null);

  const missions = useMemo(() => getDailyMissions(todayKey), [todayKey]);
  const [missionState, setMissionState] = useState<MissionState>(() => readMissionState(todayKey));
  const missionStateRef = useRef(missionState);

  const [stats, setStats] = useState<PlayStats>(() => readStats());
  const statsRef = useRef(stats);
  // Season pass: filled by rounds played, rounds won and missions done.
  const [pass, setPass] = useState<PassState>(() => readPass(monthKeyOf(todayKey)));
  const passRef = useRef(pass);
  const commitPass = useCallback((next: PassState) => {
    if (next === passRef.current) return;
    passRef.current = next;
    setPass(next);
    writePass(next);
  }, []);
  const bumpStats = useCallback(
    (add: Partial<PlayStats>) => {
      const next = addStats(statsRef.current, add);
      statsRef.current = next;
      setStats(next);
      writeStats(next);
      commitPass(
        addPassPoints(
          passRef.current,
          (add.gamesPlayed ?? 0) * PASS_POINTS.round +
            (add.gamesWon ?? 0) * PASS_POINTS.win +
            (add.missionsDone ?? 0) * PASS_POINTS.mission
        )
      );
    },
    [commitPass]
  );

  const [island, setIsland] = useState<IslandState>(() => readIsland());
  const [calendar, setCalendar] = useState<CalendarState>(() => readCalendar());
  // A friend's challenge from the address (?utmaning=seed.score), if any.
  const [challenge, setChallenge] = useState<Challenge | null>(() => parseChallenge(window.location.search));
  // Seed of the time-mode board being played, so the result can be sent on as a challenge.
  const challengeRef = useRef(challenge);
  challengeRef.current = challenge;
  const blitzSeedRef = useRef<string>('');
  // What the companion is saying right now.
  const [companionSay, setCompanionSay] = useState<{ text: string; id: number } | null>(null);
  const [seenPages, setSeenPages] = useState<string[]>(() => readSeenPages());
  const [openPage, setOpenPage] = useState<StoryPage | null>(null);

  const [blitz, setBlitz] = useState<BlitzState>(() => readBlitz(weekKey));
  const blitzRef = useRef(blitz);
  const [blitzLeft, setBlitzLeft] = useState<number>(BLITZ_SECONDS);
  const weeklyQuest = useMemo(() => getWeeklyQuest(weekKey), [weekKey]);

  // --- Win streak, pre-game starters, rescue, daily puzzle, league & intros -
  const [winStreak, setWinStreak] = useState<WinStreakState>(() => readWinStreak());
  const winStreakRef = useRef(winStreak);
  const commitWinStreak = useCallback((next: WinStreakState) => {
    winStreakRef.current = next;
    setWinStreak(next);
    writeWinStreak(next);
  }, []);
  const pendingStreakLossRef = useRef(false);

  const [armedStarters, setArmedStarters] = useState<StarterId[]>([]);
  const armedStartersRef = useRef(armedStarters);
  armedStartersRef.current = armedStarters;

  const [rescuesUsed, setRescuesUsed] = useState<number>(0);
  const rescuesUsedRef = useRef(0);

  const dailyPuzzle = useMemo(() => getDailyPuzzle(todayKey), [todayKey]);
  const [dailyPuzzleState, setDailyPuzzleState] = useState<DailyPuzzleSaveState>(() =>
    readDailyPuzzleState()
  );
  const dailyPuzzleStateRef = useRef(dailyPuzzleState);
  const commitDailyPuzzle = useCallback((next: DailyPuzzleSaveState) => {
    dailyPuzzleStateRef.current = next;
    setDailyPuzzleState(next);
    writeDailyPuzzleState(next);
  }, []);
  const dailyPuzzleSolvedToday = isDailyPuzzleSolved(dailyPuzzleState, todayKey);

  const [league, setLeague] = useState<LeagueState>(() => readLeagueState(weekKey));
  const leagueRef = useRef(league);
  const commitLeague = useCallback((next: LeagueState) => {
    leagueRef.current = next;
    setLeague(next);
    writeLeagueState(next);
  }, []);

  // --- Fever, Star Chest / Wheel, Mini-Events, Master Mode, Custom Puzzles & Cloud ---
  const [fever, setFever] = useState<FeverState>(createInitialFever);
  const feverRef = useRef(fever);
  const commitFever = useCallback((next: FeverState) => {
    feverRef.current = next;
    setFever(next);
  }, []);

  const [freeStarters, setFreeStarters] = useState<FreeStarters>(() => readFreeStarters());
  const freeStartersRef = useRef(freeStarters);
  const commitFreeStarters = useCallback((next: FreeStarters) => {
    freeStartersRef.current = next;
    setFreeStarters(next);
    writeFreeStarters(next);
  }, []);

  const [starChest, setStarChest] = useState<StarChestState>(() => readStarChestState());
  const starChestRef = useRef(starChest);
  const commitStarChest = useCallback((next: StarChestState) => {
    starChestRef.current = next;
    setStarChest(next);
    writeStarChestState(next);
  }, []);

  const [miniEvents, setMiniEvents] = useState<MiniEventsState>(() => readMiniEvents());
  const miniEventsRef = useRef(miniEvents);
  const commitMiniEvents = useCallback((next: MiniEventsState) => {
    miniEventsRef.current = next;
    setMiniEvents(next);
    writeMiniEvents(next);
  }, []);

  const [bestStars, setBestStars] = useState<Record<number, number>>(() => readBestStars());
  const [masterCrowns, setMasterCrowns] = useState<MasterCrownsMap>(() => readMasterCrowns());
  const masterCrownsRef = useRef(masterCrowns);
  const commitMasterCrowns = useCallback((next: MasterCrownsMap) => {
    masterCrownsRef.current = next;
    setMasterCrowns(next);
    writeMasterCrowns(next);
  }, []);
  const [masterModeEnabled, setMasterModeEnabled] = useState<boolean>(false);
  const masterModeRef = useRef(false);
  masterModeRef.current = masterModeEnabled;

  const [sharedCustomPuzzle, setSharedCustomPuzzle] = useState<CustomPuzzleSpec | null>(() =>
    parseCustomPuzzleFromSearch(window.location.search)
  );
  const [activeCustomPuzzle, setActiveCustomPuzzle] = useState<CustomPuzzleSpec | null>(null);
  const activeCustomPuzzleRef = useRef(activeCustomPuzzle);
  activeCustomPuzzleRef.current = activeCustomPuzzle;

  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>(() => readPlayerProfile());
  const playerProfileRef = useRef(playerProfile);
  const commitPlayerProfile = useCallback((next: PlayerProfile) => {
    playerProfileRef.current = next;
    setPlayerProfile(next);
    writePlayerProfile(next);
  }, []);

  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => readCloudConfig());
  const cloudConfigRef = useRef(cloudConfig);
  const commitCloudConfig = useCallback((next: CloudConfig) => {
    cloudConfigRef.current = next;
    setCloudConfig(next);
    writeCloudConfig(next);
  }, []);
  const [globalLeague, setGlobalLeague] = useState<GlobalLeaderboardRow[] | null>(null);
  const [globalBlitz, setGlobalBlitz] = useState<GlobalLeaderboardRow[] | null>(null);

  const awardLeague = useCallback(
    (pts: number) => {
      if (pts <= 0) return;
      const next = addLeaguePoints(leagueRef.current, pts, weekKey);
      commitLeague(next);
      if (isCloudConfigured(cloudConfigRef.current)) {
        void submitGlobalScore(cloudConfigRef.current, {
          board: 'league',
          periodKey: weekKey,
          playerId: playerProfileRef.current.playerId,
          handle: playerProfileRef.current.handle || t('Du'),
          color: companion,
          score: next.points,
        });
      }
    },
    [commitLeague, companion, weekKey]
  );

  const [seenObstacles, setSeenObstacles] = useState<ObstacleIntroId[]>(() => readSeenObstacles());
  const seenObstaclesRef = useRef(seenObstacles);
  const [activeObstacleIntro, setActiveObstacleIntro] = useState<ObstacleIntroDef | null>(null);

  const [flyingGoals, setFlyingGoals] = useState<FlyingGoalToken[]>([]);
  const flySeqRef = useRef<number>(1);
  const [bumpedGoals, setBumpedGoals] = useState<Record<string, number>>({});
  const [bossHitNonce, setBossHitNonce] = useState<number>(0);

  const [endlessTarget, setEndlessTarget] = useState<number>(ENDLESS_MILESTONE_STEP);
  const activeLevel: LevelConfig = useMemo(() => {
    if (mode === 'campaign') {
      const base = getCampaignLevel(levelIdx);
      return masterModeEnabled && canPlayMasterMode(bestStars, base.id)
        ? applyMasterMode(base)
        : base;
    }
    if (mode === 'daily') return dailyChallenge.level;
    if (mode === 'weekly') return weeklyLevel.level;
    if (mode === 'puzzle') return dailyPuzzle.level;
    if (mode === 'custom' && activeCustomPuzzle) return customPuzzleToLevel(activeCustomPuzzle);
    if (mode === 'blitz') {
      return {
        ...ENDLESS_CONFIG,
        name: 'Tidsläge',
        subtitle: 'Så många poäng du hinner på 60 sekunder',
        objectives: [
          {
            id: 'blitz-score',
            kind: 'score',
            label: 'Slå ditt rekord',
            target: Math.max(blitz.best, 3000),
          },
        ],
      };
    }
    return {
      ...ENDLESS_CONFIG,
      objectives: [
        {
          id: 'endless-score',
          kind: 'score',
          label: 'Nästa bonus (+5 drag)',
          target: endlessTarget,
        },
      ],
    };
  }, [
    activeCustomPuzzle,
    bestStars,
    blitz.best,
    dailyChallenge,
    dailyPuzzle,
    endlessTarget,
    levelIdx,
    masterModeEnabled,
    mode,
    weeklyLevel,
  ]);

  const [tutorialDone, setTutorialDone] = useState<boolean>(() =>
    readFlag(STORAGE_KEYS.tutorialDone)
  );
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId>(() =>
    !readFlag(STORAGE_KEYS.tutorialDone) ? 'step1' : 'done'
  );

  const [board, setBoard] = useState<Board>(() =>
    !readFlag(STORAGE_KEYS.tutorialDone) ? createTutorialBoard() : createBoard(getCampaignLevel(0))
  );
  const [transitionMode, setTransitionMode] = useState<BoardTransitionMode>('none');
  const [movesLeft, setMovesLeft] = useState<number>(getCampaignLevel(0).moves);
  const [progress, setProgress] = useState<LevelProgress>(() => createEmptyProgress());
  const [energy, setEnergy] = useState<number>(0);
  const [lastCascade, setLastCascade] = useState<number>(1);
  const [maxCascade, setMaxCascade] = useState<number>(1);

  const [selected, setSelected] = useState<Coord | null>(null);
  const [hintPair, setHintPair] = useState<[Coord, Coord] | null>(null);
  const [clearingKeys, setClearingKeys] = useState<Set<string>>(new Set());
  const [invalidPair, setInvalidPair] = useState<[Coord, Coord] | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [shaking, setShaking] = useState<boolean>(false);
  const [busy, setBusy] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [dailyReward, setDailyReward] = useState<DailyRewardResult | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const [savedGame, setSavedGame] = useState<SavedGame | null>(() =>
    loadResumableSave(
      Math.min(CAMPAIGN_LEVEL_COUNT - 1, Math.max(0, readInt(STORAGE_KEYS.unlocked, 0))),
      getDailyKey()
    )
  );

  const tutorialPrompt = useMemo(
    () =>
      mode === 'campaign' && tutorialStep !== 'done'
        ? resolveTutorialPrompt(tutorialStep, board)
        : null,
    [board, mode, tutorialStep]
  );

  const [endSnapshot, setEndSnapshot] = useState<EndSnapshot>(EMPTY_SNAPSHOT);
  const [comboNotice, setComboNotice] = useState<{ type: ComboType; nonce: number } | null>(null);
  const comboNoticeTimerRef = useRef<number | null>(null);

  const clearComboNotice = useCallback(() => {
    if (comboNoticeTimerRef.current !== null) {
      window.clearTimeout(comboNoticeTimerRef.current);
      comboNoticeTimerRef.current = null;
    }
    setComboNotice(null);
  }, []);

  const [achievementState, setAchievementState] = useState<AchievementSaveState>(() =>
    readAchievementState(dailyState.completedDates.length)
  );
  const achievementStateRef = useRef<AchievementSaveState>(achievementState);
  achievementStateRef.current = achievementState;

  const [achievementToast, setAchievementToast] = useState<AchievementDef | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const fxRef = useRef<ParticleCanvasHandle | null>(null);
  // Bumped whenever a run is replaced, so in-flight animations stop touching state.
  const runTokenRef = useRef<number>(0);

  // --- Persistence of the run in progress ---------------------------------

  // Save after every completed move so closing the tab never loses a run.
  useEffect(() => {
    if (phase === 'VICTORY' || phase === 'GAME_OVER') {
      clearSavedGame();
      setSavedGame(null);
      return;
    }
    if (phase !== 'PLAYING' && phase !== 'PAUSED') return;
    // Mid-animation state is not a position the player can return to, and the
    // scripted tutorial board is simply replayed instead of restored.
    if (busy || tutorialStep !== 'done') return;
    // A round against the clock cannot be paused over a restart, and the
    // weekly level, puzzles, custom levels and Master Mode always start fresh.
    if (
      mode === 'blitz' ||
      mode === 'weekly' ||
      mode === 'puzzle' ||
      mode === 'custom' ||
      (mode === 'campaign' && masterModeEnabled)
    ) {
      return;
    }
    // Nothing worth keeping until the first move has been made.
    if (progress.score <= 0 && movesLeft >= activeLevel.moves) return;

    writeSavedGame({
      mode,
      levelIdx,
      dailyKey: mode === 'daily' ? todayKey : null,
      board,
      movesLeft,
      progress,
      energy,
      maxCascade,
      endlessTarget,
      seed: runSeedRef.current,
    });
  }, [
    activeLevel.moves,
    board,
    busy,
    endlessTarget,
    energy,
    levelIdx,
    maxCascade,
    mode,
    movesLeft,
    phase,
    progress,
    todayKey,
    tutorialStep,
  ]);

  // --- Achievements --------------------------------------------------------

  const notifyAchievements = useCallback((unlocked: AchievementDef[]) => {
    if (unlocked.length === 0) return;
    const totalReward = unlocked.reduce((sum, item) => sum + item.rewardEnergy, 0);
    if (totalReward > 0) {
      setDailyState((prev) => {
        const next: DailySaveState = {
          ...prev,
          bonusEnergyBank: Math.min(MAX_ENERGY_BANK, prev.bonusEnergyBank + totalReward),
        };
        writeDailyState(next);
        return next;
      });
    }

    const latest = unlocked[unlocked.length - 1];
    soundEngine.playSpecialCreate('prism');
    setAchievementToast(latest);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setAchievementToast(null);
      toastTimerRef.current = null;
    }, 3600);
  }, []);

  // --- Menu actions --------------------------------------------------------

  const selectMode = useCallback((next: GameMode) => {
    soundEngine.playClick();
    setMode(next);
  }, []);

  const selectLevel = useCallback(
    (idx: number) => {
      soundEngine.playClick();
      setLevelIdx(idx);
      const lvl = getCampaignLevel(idx);
      if (!canPlayMasterMode(bestStars, lvl.id)) {
        setMasterModeEnabled(false);
      }
    },
    [bestStars]
  );

  const toggleMasterMode = useCallback(() => {
    const lvl = getCampaignLevel(levelIdx);
    if (!canPlayMasterMode(bestStars, lvl.id)) return;
    soundEngine.playClick();
    setMasterModeEnabled((prev) => !prev);
  }, [bestStars, levelIdx]);

  const equipSkin = useCallback((skin: AnimalSkinId) => {
    setDailyState((prev) => {
      const next = equipAnimalSkin(prev, skin);
      writeDailyState(next);
      return next;
    });
    soundEngine.playClick();
  }, []);

  const openGuide = useCallback(() => {
    soundEngine.playClick();
    setShowGuide(true);
  }, []);

  const closeGuide = useCallback(() => {
    setShowGuide(false);
    // If storage is blocked the guide simply shows again next time.
    writeFlag(STORAGE_KEYS.introGuideSeen, true);
  }, []);

  const backToTitle = useCallback(() => {
    runTokenRef.current += 1;
    clearComboNotice();
    if (pendingStreakLossRef.current) {
      pendingStreakLossRef.current = false;
      commitWinStreak(resetWinStreak(winStreakRef.current));
      commitMiniEvents(failLavaTrail(miniEventsRef.current));
    }
    commitFever(createInitialFever());
    soundEngine.playClick();
    setShowGuide(false);
    setActiveObstacleIntro(null);
    setFlyingGoals([]);
    setShareNotice(null);
    setSavedGame(loadResumableSave(highestUnlockedIdx, todayKey));
    // Weekly, daily-puzzle and custom runs are one-offs with no tab on the menu.
    // Leaving the menu pointed at one of them shows an empty left column and
    // makes Play now restart that run, so fall back to the campaign.
    if (mode === 'weekly' || mode === 'puzzle' || mode === 'custom') setMode('campaign');
    setPhase('TITLE_MENU');
  }, [clearComboNotice, commitFever, commitMiniEvents, commitWinStreak, highestUnlockedIdx, todayKey, mode]);

  /** Clears every transient board interaction; shared by start and resume. */
  const resetInteraction = useCallback(() => {
    clearComboNotice();
    commitFever(createInitialFever());
    setTransitionMode('none');
    setLastCascade(1);
    setSelected(null);
    setHintPair(null);
    setClearingKeys(new Set());
    setInvalidPair(null);
    setActiveTool(null);
    setShaking(false);
    setBusy(false);
    setDailyReward(null);
    setShareNotice(null);
    setFlyingGoals([]);
    setBumpedGoals({});
  }, [clearComboNotice, commitFever]);

  const startSession = useCallback(
    (
      targetMode: GameMode,
      targetIdx: number,
      forceTutorial = false,
      playIntro = false,
      skipTutorial = false,
      customSpecOverride?: CustomPuzzleSpec | null
    ) => {
      if (pendingStreakLossRef.current) {
        pendingStreakLossRef.current = false;
        commitWinStreak(resetWinStreak(winStreakRef.current));
        commitMiniEvents(failLavaTrail(miniEventsRef.current));
      }

      // Campaign levels need a life. Out of lives: back to the menu, where the
      // countdown to the next one is shown.
      if (targetMode === 'campaign' && !skipTutorial) {
        const settled = settleLives(livesRef.current, Date.now());
        if (settled !== livesRef.current) commitLives(settled);
        if (settled.lives <= 0) {
          setPhase('TITLE_MENU');
          return;
        }
      }
      runTokenRef.current += 1;
      const customSpec = customSpecOverride ?? activeCustomPuzzleRef.current;
      const isMaster =
        targetMode === 'campaign' &&
        masterModeRef.current &&
        canPlayMasterMode(bestStars, getCampaignLevel(targetIdx).id);
      if (targetMode === 'campaign' && !isMaster && masterModeRef.current) {
        setMasterModeEnabled(false);
      }

      const lvl =
        targetMode === 'campaign'
          ? isMaster
            ? applyMasterMode(getCampaignLevel(targetIdx))
            : getCampaignLevel(targetIdx)
          : targetMode === 'daily'
          ? dailyChallenge.level
          : targetMode === 'weekly'
          ? weeklyLevel.level
          : targetMode === 'puzzle'
          ? dailyPuzzle.level
          : targetMode === 'custom' && customSpec
          ? customPuzzleToLevel(customSpec)
          : ENDLESS_CONFIG;
      if (targetMode === 'weekly') {
        commitWeeklyLevel({ ...weeklyLevelRef.current, attempts: weeklyLevelRef.current.attempts + 1 });
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      const runTutorial = shouldRunTutorial({
        mode: targetMode,
        targetLevelIndex: targetIdx,
        tutorialDone,
        forceTutorial,
        skipTutorial,
      });
      const willShowGuide =
        playIntro &&
        targetMode === 'campaign' &&
        (forceTutorial || !readFlag(STORAGE_KEYS.introGuideSeen));
      setShowGuide(willShowGuide);

      // Starting the same run over abandons its save. A save from another
      // level or mode stays until this run makes its first move.
      const existing = readSavedGame();
      if (
        existing &&
        existing.mode === targetMode &&
        (targetMode !== 'campaign' || existing.levelIdx === targetIdx)
      ) {
        clearSavedGame();
        setSavedGame(null);
      }

      // Deduct any armed pre-game starters (free tokens first, then bonus bank) and compute win-streak specials.
      let bankState = dailyStateRef.current;
      const startSpecials: SpecialType[] = [];
      let starterCount = 0;
      let streakCount = 0;

      if (targetMode === 'campaign' && !runTutorial && !skipTutorial) {
        const streakBonus = winStreakSpecials(winStreakRef.current.streak);
        streakCount = streakBonus.length;
        startSpecials.push(...streakBonus);

        const armed = armedStartersRef.current;
        if (armed.length > 0) {
          const cost = starterSelectionCost(armed, freeStartersRef.current);
          if (bankState.bonusEnergyBank >= cost) {
            const consumed = consumeFreeStarters(freeStartersRef.current, armed);
            if (consumed.nextInv !== freeStartersRef.current) {
              commitFreeStarters(consumed.nextInv);
            }
            bankState = { ...bankState, bonusEnergyBank: bankState.bonusEnergyBank - cost };
            for (const id of armed) {
              const def = STARTERS.find((s) => s.id === id);
              if (def) {
                startSpecials.push(def.special);
                starterCount += 1;
              }
            }
          }
          setArmedStarters([]);
        }
      }

      // Keep a reserve of 80 bonus energy in the bank so players can spend it
      // on pre-game starters, Rescue (+5 moves) and life refills. Excess above
      // the reserve still flows into the round's tool bar automatically.
      const BANK_RESERVE = 80;
      let startingEnergy = 0;
      if (skipTutorial) {
        startingEnergy = energy;
      } else if (
        targetMode !== 'daily' &&
        targetMode !== 'puzzle' &&
        targetMode !== 'custom' &&
        bankState.bonusEnergyBank > BANK_RESERVE
      ) {
        const excess = Math.min(MAX_ENERGY, bankState.bonusEnergyBank - BANK_RESERVE);
        startingEnergy = excess;
        bankState = { ...bankState, bonusEnergyBank: bankState.bonusEnergyBank - excess };
      }
      if (bankState !== dailyStateRef.current) {
        commitDaily(bankState);
      }

      resetInteraction();
      setMode(targetMode);
      setLevelIdx(targetIdx);
      setEndlessTarget(ENDLESS_MILESTONE_STEP);
      setTutorialStep(runTutorial ? 'step1' : 'done');
      rescuesUsedRef.current = 0;
      setRescuesUsed(0);
      if (targetMode === 'blitz') blitzSeedRef.current = challengeRef.current?.seed ?? newChallengeSeed();

      const runStartSeed = Math.floor(Math.random() * 2 ** 31);
      setRunSeed(runStartSeed);
      runSeedRef.current = runStartSeed;

      let nextBoard = runTutorial
        ? createTutorialBoard()
        : targetMode === 'daily'
        ? createBoard(lvl, createSeededRng(dailyChallenge.seed))
        : targetMode === 'weekly'
        ? createBoard(lvl, createSeededRng(weeklyLevel.seed))
        : targetMode === 'puzzle'
        ? buildPuzzleBoard(dailyPuzzle.spec)
        : targetMode === 'custom' && customSpec
        ? buildCustomPuzzleBoard(customSpec)
        : targetMode === 'blitz'
        ? createBoard(lvl, createSeededRng(`animalpuzzle-challenge-${blitzSeedRef.current}`))
        : createBoard(lvl, createSeededRng(`run-${runStartSeed}`));

      if (startSpecials.length > 0) {
        const planted = applyStartSpecials(nextBoard, startSpecials);
        nextBoard = planted.board;
      }

      // First-time obstacle mini-intro (skipped during scripted tutorial/guide, puzzle or custom).
      if (!runTutorial && !willShowGuide && targetMode !== 'puzzle' && targetMode !== 'custom') {
        const intro = detectNewObstacle(lvl, seenObstaclesRef.current);
        setActiveObstacleIntro(intro);
      } else {
        setActiveObstacleIntro(null);
      }

      setBoard(nextBoard);
      setMovesLeft(lvl.moves);
      setProgress(createEmptyProgress());
      setEnergy(startingEnergy);
      setPowerCharge(0);
      setBlitzLeft(BLITZ_SECONDS);
      if (!skipTutorial) bumpStats({ gamesPlayed: 1 });
      setMaxCascade(1);

      let notice: string | null = null;
      if (isMaster) {
        notice = t('Mästarläge aktivt · 2× ligapoäng!');
      } else if (streakCount > 0 && starterCount > 0) {
        notice = t('Vinstsvit + startbonus: +{n} specialbrickor!', { n: streakCount + starterCount });
      } else if (streakCount > 0) {
        notice = t('Vinstsvit! +{n} startspecialer på brädet', { n: streakCount });
      } else if (starterCount > 0) {
        notice = t('Startbonus aktiverad! +{n} specialer', { n: starterCount });
      } else if (startingEnergy > 0) {
        notice = t('Bonusenergi aktiverad: +{n}', { n: startingEnergy });
      }
      setStatusNotice(notice);
      if (notice) {
        window.setTimeout(() => {
          setStatusNotice((curr) => (curr === notice ? null : curr));
        }, 2800);
      }
      setPhase('PLAYING');
    },
    [
      bestStars,
      bumpStats,
      commitDaily,
      commitFreeStarters,
      commitLives,
      commitMiniEvents,
      commitWeeklyLevel,
      commitWinStreak,
      dailyChallenge,
      dailyPuzzle,
      energy,
      resetInteraction,
      tutorialDone,
      weeklyLevel,
    ]
  );

  // Sync Fever Mode music tempo boost whenever Fever ignites/ends.
  useEffect(() => {
    soundEngine.setFeverMode(phase === 'PLAYING' && isFeverActive(fever));
  }, [fever, phase]);

  // Each landscape has its own music; menus and the other modes keep the calm tune.
  useEffect(() => {
    const inCampaign = mode === 'campaign' && phase !== 'TITLE_MENU';
    soundEngine.setMusicTheme(inCampaign ? biomeOfChapter(activeLevel.chapter ?? 1) : 'skargard');
  }, [mode, phase, activeLevel]);

  // Lives come back while the game is open.
  useEffect(() => {
    if (lives.lives >= MAX_LIVES) return;
    const timer = window.setInterval(() => {
      const settled = settleLives(livesRef.current, Date.now());
      if (settled !== livesRef.current) commitLives(settled);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [lives.lives, commitLives]);

  // Time played, counted while a board is on screen.
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const timer = window.setInterval(() => bumpStats({ secondsPlayed: 5 }), 5000);
    return () => window.clearInterval(timer);
  }, [phase, bumpStats]);

  // The clock of the time mode only runs while playing.
  useEffect(() => {
    if (phase !== 'PLAYING' || mode !== 'blitz') return;
    const timer = window.setInterval(() => setBlitzLeft((left) => Math.max(0, left - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, mode]);

  /** Adds an event to today's missions and pays out the ones it finishes. */
  const reportMission = useCallback(
    (event: MissionEvent) => {
      const res = applyMissionEvent(missionStateRef.current, missions, event);
      if (res.nextState === missionStateRef.current) return;
      missionStateRef.current = res.nextState;
      setMissionState(res.nextState);
      writeMissionState(res.nextState);
      if (res.energy > 0) {
        commitDaily(grantReward(dailyStateRef.current, res.energy, null).nextState);
        bumpStats({ missionsDone: res.completed.length });
        soundEngine.playSpecialCreate('prism');
        setStatusNotice(t('Uppdrag klart! +{n} bonusenergi', { n: res.energy }));
        window.setTimeout(() => setStatusNotice(null), 2600);
      }
    },
    [bumpStats, commitDaily, missions]
  );

  const selectCompanion = useCallback((color: GemColor) => {
    if (!isCompanionUnlocked(color, rewardStateRef.current.album)) return;
    soundEngine.playClick();
    setCompanion(color);
    writeCompanion(color);
  }, []);

  /** Spends stars on the next building of the island. */
  const buildNext = useCallback(() => {
    const res = build(island, totalStars(bestStars));
    if (!res.built) return;
    setIsland(res.nextState);
    writeIsland(res.nextState);
    commitDaily(grantReward(dailyStateRef.current, BUILD_GIFT, null).nextState);
    soundEngine.playSpecialCreate('nova');
    vibrate('victory');
  }, [bestStars, commitDaily, island]);

  /** Upgrades the next building; an upgraded building pays the daily gift twice. */
  const upgradeNext = useCallback(() => {
    const res = upgrade(island, totalStars(bestStars));
    if (!res.upgraded) return;
    setIsland(res.nextState);
    writeIsland(res.nextState);
    soundEngine.playSpecialCreate('nova');
    vibrate('victory');
  }, [bestStars, island]);

  /** Collects every season-pass step that has been reached. */
  const claimPassRewards = useCallback(() => {
    const res = claimPass(passRef.current);
    if (res.energy <= 0) return;
    commitPass(res.nextState);
    commitDaily(grantReward(dailyStateRef.current, res.energy, null).nextState);
    soundEngine.playSpecialCreate('prism');
  }, [commitDaily, commitPass]);

  /** Opens today's box in the login calendar. */
  const claimLoginGift = useCallback(() => {
    const res = claimCalendar(calendar, todayKey);
    if (res.energy <= 0) return;
    setCalendar(res.nextState);
    writeCalendar(res.nextState);
    commitDaily(grantReward(dailyStateRef.current, res.energy, null).nextState);
    soundEngine.playSpecialCreate('prism');
  }, [calendar, commitDaily, todayKey]);

  const dismissChallenge = useCallback(() => {
    setChallenge(null);
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      // The address bar is cosmetic here.
    }
  }, []);

  // --- Companion speech bubbles ---------------------------------------------
  const say = useCallback((kind: QuipKind) => {
    setCompanionSay((prev) => ({ text: pickQuip(kind), id: (prev?.id ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    if (!companionSay) return;
    const timer = window.setTimeout(() => setCompanionSay(null), 2600);
    return () => window.clearTimeout(timer);
  }, [companionSay]);
  useEffect(() => {
    if (phase === 'PLAYING' && lastCascade >= QUIP_CASCADE) say('cascade');
  }, [lastCascade, phase, say]);
  useEffect(() => {
    if (phase === 'PLAYING' && mode !== 'blitz' && movesLeft === QUIP_LOW_MOVES) say('lowMoves');
  }, [mode, movesLeft, phase, say]);
  const powerReady = powerCharge >= powerNeeded;
  useEffect(() => {
    if (phase === 'PLAYING' && powerReady) say('powerReady');
    // Only when the power becomes ready, not on every phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [powerReady]);

  /** Collects the island's gift of the day. */
  const collectIslandGift = useCallback(() => {
    const res = collectGift(island, todayKey);
    if (res.energy <= 0) return;
    setIsland(res.nextState);
    writeIsland(res.nextState);
    commitDaily(grantReward(dailyStateRef.current, res.energy, null).nextState);
    soundEngine.playSpecialCreate('prism');
  }, [commitDaily, island, todayKey]);

  const closeBossStory = useCallback(() => setBossStory(null), []);

  // The story page that is waiting to be read, if any.
  const duePage = useMemo(
    () => nextUnseenPage(Math.floor(highestUnlockedIdx / LEVELS_PER_CHAPTER) + 1, seenPages),
    [highestUnlockedIdx, seenPages]
  );
  const storyPage = openPage ?? (phase === 'TITLE_MENU' ? duePage : null);

  const closeStory = useCallback(() => {
    if (openPage) {
      setOpenPage(null);
      return;
    }
    if (!duePage) return;
    const next = [...seenPages, duePage.id];
    setSeenPages(next);
    writeSeenPages(next);
  }, [duePage, openPage, seenPages]);

  const readStory = useCallback((id: string) => {
    setOpenPage(STORY_PAGES.find((page) => page.id === id) ?? null);
  }, []);

  /** Trades bonus energy for a full set of lives. */
  const buyLives = useCallback(() => {
    const bank = dailyStateRef.current;
    if (bank.bonusEnergyBank < REFILL_COST) return;
    commitDaily({ ...bank, bonusEnergyBank: bank.bonusEnergyBank - REFILL_COST });
    commitLives(refillLives());
  }, [commitDaily, commitLives]);

  const startSelected = useCallback(() => {
    if (showGuide) return;
    soundEngine.playClick();
    startSession(mode, levelIdx, false, true);
  }, [levelIdx, mode, showGuide, startSession]);

  const startWeekly = useCallback(() => {
    soundEngine.playClick();
    startSession('weekly', 0);
  }, [startSession]);

  const startDailyPuzzle = useCallback(() => {
    soundEngine.playClick();
    startSession('puzzle', 0);
  }, [startSession]);

  const startCustomPuzzle = useCallback(
    (spec: CustomPuzzleSpec) => {
      soundEngine.playClick();
      setActiveCustomPuzzle(spec);
      activeCustomPuzzleRef.current = spec;
      startSession('custom', 0, false, false, false, spec);
    },
    [startSession]
  );

  const dismissSharedCustomPuzzle = useCallback(() => {
    setSharedCustomPuzzle(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('pussel');
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      // cosmetic
    }
  }, []);

  const toggleStarter = useCallback((id: StarterId) => {
    soundEngine.playClick();
    setArmedStarters((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      const next = [...prev, id];
      if (starterSelectionCost(next, freeStartersRef.current) > dailyStateRef.current.bonusEnergyBank) {
        return prev;
      }
      return next;
    });
  }, []);

  const claimStarChestReward = useCallback((): StarChestReward | null => {
    const res = openStarChest(starChestRef.current);
    if (!res.reward) return null;
    commitStarChest(res.nextState);
    commitDaily(grantReward(dailyStateRef.current, res.reward.energy, null).nextState);
    commitFreeStarters(addFreeStarter(freeStartersRef.current, res.reward.starter, 1));
    soundEngine.playVictory();
    vibrate('victory');
    return res.reward;
  }, [commitDaily, commitFreeStarters, commitStarChest]);

  const spinLuckyWheel = useCallback((): { sliceIndex: number; slice: WheelSlice } | null => {
    const res = spinDailyWheel(starChestRef.current, todayKey);
    if (!res) return null;
    commitStarChest(res.nextState);
    if (res.slice.kind === 'energy' && res.slice.energy) {
      commitDaily(grantReward(dailyStateRef.current, res.slice.energy, null).nextState);
    } else if (res.slice.kind === 'starter' && res.slice.starter) {
      commitFreeStarters(addFreeStarter(freeStartersRef.current, res.slice.starter, 1));
    } else if (res.slice.kind === 'lives') {
      commitLives(refillLives());
    }
    return { sliceIndex: res.sliceIndex, slice: res.slice };
  }, [commitDaily, commitFreeStarters, commitLives, commitStarChest, todayKey]);

  const beginStarRace = useCallback(() => {
    soundEngine.playClick();
    commitMiniEvents(startStarRace(miniEventsRef.current, Date.now()));
  }, [commitMiniEvents]);

  const claimRaceReward = useCallback((): MiniEventReward | null => {
    const res = claimStarRaceReward(miniEventsRef.current, Date.now());
    if (!res.reward) return null;
    commitMiniEvents(res.nextState);
    if (res.reward.energy > 0) {
      commitDaily(grantReward(dailyStateRef.current, res.reward.energy, null).nextState);
    }
    let inv = freeStartersRef.current;
    for (const s of res.reward.starters) inv = addFreeStarter(inv, s, 1);
    if (inv !== freeStartersRef.current) commitFreeStarters(inv);
    soundEngine.playVictory();
    vibrate('victory');
    return res.reward;
  }, [commitDaily, commitFreeStarters, commitMiniEvents]);

  const beginLavaTrail = useCallback(() => {
    soundEngine.playClick();
    commitMiniEvents(startLavaTrail(miniEventsRef.current));
  }, [commitMiniEvents]);

  const claimLavaReward = useCallback((): MiniEventReward | null => {
    const res = claimLavaTrailReward(miniEventsRef.current);
    if (!res.reward) return null;
    commitMiniEvents(res.nextState);
    if (res.reward.energy > 0) {
      commitDaily(grantReward(dailyStateRef.current, res.reward.energy, null).nextState);
    }
    let inv = freeStartersRef.current;
    for (const s of res.reward.starters) inv = addFreeStarter(inv, s, 1);
    if (inv !== freeStartersRef.current) commitFreeStarters(inv);
    soundEngine.playVictory();
    vibrate('victory');
    return res.reward;
  }, [commitDaily, commitFreeStarters, commitMiniEvents]);

  const updatePlayerHandle = useCallback(
    (handle: string) => {
      commitPlayerProfile({ ...playerProfileRef.current, handle: handle.trim().slice(0, 18) });
    },
    [commitPlayerProfile]
  );

  const saveCloudSettings = useCallback(
    (cfg: CloudConfig) => {
      commitCloudConfig(cfg);
    },
    [commitCloudConfig]
  );

  const refreshGlobalBoard = useCallback(
    async (boardKind: LeaderboardBoard) => {
      if (!isCloudConfigured(cloudConfigRef.current)) return;
      const rows = await fetchGlobalLeaderboard(
        cloudConfigRef.current,
        boardKind,
        weekKey,
        playerProfileRef.current.playerId
      );
      if (!rows) return;
      if (boardKind === 'league') setGlobalLeague(rows);
      else setGlobalBlitz(rows);
    },
    [weekKey]
  );

  const dismissObstacleIntro = useCallback(() => {
    soundEngine.playClick();
    setActiveObstacleIntro((curr) => {
      if (curr && !seenObstaclesRef.current.includes(curr.id)) {
        const next = [...seenObstaclesRef.current, curr.id];
        seenObstaclesRef.current = next;
        setSeenObstacles(next);
        writeSeenObstacles(next);
      }
      return null;
    });
  }, []);

  const claimWeeklyLeagueReward = useCallback(() => {
    const res = claimLeagueReward(leagueRef.current);
    if (res.energy <= 0 && !leagueRef.current.pendingReward) return;
    commitLeague(res.nextState);
    if (res.energy > 0) {
      commitDaily(grantReward(dailyStateRef.current, res.energy, null).nextState);
    }
    soundEngine.playSpecialCreate('prism');
    vibrate('victory');
  }, [commitDaily, commitLeague]);

  /** Spends bonus energy (and if needed in-round energy) for +5 extra moves on Game Over. */
  const rescueRun = useCallback(() => {
    if (phase !== 'GAME_OVER') return;
    const used = rescuesUsedRef.current;
    const cost = rescueCost(used);
    if (!canAffordRescue(mode, used, dailyStateRef.current.bonusEnergyBank, energy)) return;
    const payment = splitRescuePayment(dailyStateRef.current.bonusEnergyBank, energy, cost);
    if (!payment) return;

    soundEngine.playSpecialCreate('prism');
    vibrate('victory');

    // Refund the life deducted on Game Over and preserve the win streak.
    pendingStreakLossRef.current = false;
    if (mode === 'campaign') {
      const current = livesRef.current;
      const nextLives = Math.min(MAX_LIVES, current.lives + 1);
      commitLives({
        lives: nextLives,
        since: nextLives >= MAX_LIVES ? 0 : current.since,
      });
    }

    commitDaily({ ...dailyStateRef.current, bonusEnergyBank: payment.nextBank });
    setEnergy(payment.nextRound);
    setBoard((curr) => defuseExplodedBombs(curr));
    setMovesLeft(RESCUE_MOVES);
    const nextUsed = used + 1;
    rescuesUsedRef.current = nextUsed;
    setRescuesUsed(nextUsed);
    setStatusNotice(t('+{n} extra drag – kör på!', { n: RESCUE_MOVES }));
    window.setTimeout(() => setStatusNotice(null), 2400);
    setPhase('PLAYING');
  }, [commitDaily, commitLives, energy, mode, phase]);

  /** Starts the time mode on the board of a friend's challenge. */
  const startChallenge = useCallback(() => {
    soundEngine.playClick();
    setMode('blitz');
    startSession('blitz', 0);
  }, [startSession]);

  const restart = useCallback(() => {
    soundEngine.playClick();
    startSession(mode, levelIdx);
  }, [levelIdx, mode, startSession]);

  const nextLevel = useCallback(() => {
    soundEngine.playClick();
    const nextIdx = Math.min(CAMPAIGN_LEVEL_COUNT - 1, levelIdx + 1);
    const nextId = getCampaignLevel(nextIdx).id;
    if (!canPlayMasterMode(bestStars, nextId)) {
      masterModeRef.current = false;
      setMasterModeEnabled(false);
    }
    startSession('campaign', nextIdx);
  }, [bestStars, levelIdx, startSession]);

  const replayTutorial = useCallback(() => {
    soundEngine.playClick();
    startSession('campaign', 0, true, true);
  }, [startSession]);

  /** Continues the stored run exactly where the last completed move left it. */
  const resumeSaved = useCallback(() => {
    const save = loadResumableSave(highestUnlockedIdx, todayKey);
    setSavedGame(save);
    if (!save) return;

    runTokenRef.current += 1;
    soundEngine.playClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    resetInteraction();
    setShowGuide(false);
    setActiveObstacleIntro(null);
    rescuesUsedRef.current = 0;
    setRescuesUsed(0);
    setMode(save.mode);
    if (save.mode === 'campaign') setLevelIdx(save.levelIdx);
    setEndlessTarget(save.endlessTarget);
    setTutorialStep('done');
    setBoard(save.board);
    setMovesLeft(save.movesLeft);
    setProgress(save.progress);
    setEnergy(save.energy);
    setMaxCascade(save.maxCascade);
    if (save.seed !== undefined) {
      setRunSeed(save.seed);
      runSeedRef.current = save.seed;
    }
    setStatusNotice(t('Välkommen tillbaka – partiet fortsätter där du slutade'));
    window.setTimeout(() => setStatusNotice(null), 2600);
    setPhase('PLAYING');
  }, [highestUnlockedIdx, resetInteraction, todayKey]);

  const skipTutorial = useCallback(() => {
    soundEngine.playClick();
    setTutorialStep('done');
    setTutorialDone(true);
    writeFlag(STORAGE_KEYS.tutorialDone, true);
    startSession('campaign', levelIdx, false, false, true);
    setStatusNotice(t('Guide hoppad över — spela fritt!'));
    window.setTimeout(() => setStatusNotice(null), 2000);
  }, [levelIdx, startSession]);

  const pause = useCallback(() => {
    if (busy) return;
    soundEngine.playClick();
    setPhase('PAUSED');
  }, [busy]);

  const resume = useCallback(() => {
    soundEngine.playClick();
    setPhase('PLAYING');
  }, []);

  // --- Playing out a move --------------------------------------------------

  const recordBestScore = useCallback(
    (score: number): number => {
      // Only the three classic modes keep a best score of their own.
      if (mode === 'weekly' || mode === 'blitz' || mode === 'puzzle' || mode === 'custom') {
        return Math.max(0, Math.round(score));
      }
      const record = nextBestScore(
        {
          campaign: bestCampaignScore,
          daily: bestDailyScore,
          endless: bestEndlessScore,
        },
        mode,
        score
      );
      if (record.mode === 'campaign') setBestCampaignScore(record.best);
      else if (record.mode === 'daily') setBestDailyScore(record.best);
      else setBestEndlessScore(record.best);
      writeInt(BEST_SCORE_STORAGE_KEYS[record.mode], record.best);
      return record.best;
    },
    [bestCampaignScore, bestDailyScore, bestEndlessScore, mode]
  );

  /** Launches miniature icons flying from cleared board cells to matching HUD goal pills. */
  const emitGoalFlights = useCallback(
    (
      step: SwapResult['steps'][number],
      prevProgress: LevelProgress,
      nextProgress: LevelProgress,
      level: LevelConfig
    ) => {
      if (prefersReducedMotion()) return;
      const boardEl = document.querySelector<HTMLElement>('[data-testid="game-board"]');
      if (!boardEl) return;
      const boardRect = boardEl.getBoundingClientRect();
      if (boardRect.width <= 0 || boardRect.height <= 0) return;
      const cellW = boardRect.width / 8;
      const cellH = boardRect.height / 8;
      const skin = dailyStateRef.current.equippedSkin;

      const spawned: FlyingGoalToken[] = [];
      const hitGoalIds: string[] = [];
      let bossDamaged = false;

      for (const goal of level.objectives) {
        if (goal.kind === 'score') continue;
        const before = getObjectiveCurrent(goal, prevProgress);
        const after = getObjectiveCurrent(goal, nextProgress);
        const delta = Math.min(3, after - before);
        if (delta <= 0) continue;

        hitGoalIds.push(goal.id);
        if (goal.kind === 'boss') bossDamaged = true;

        const targetEl = document.querySelector<HTMLElement>(`[data-goal-id="${goal.id}"]`);
        if (!targetEl) continue;
        const targetRect = targetEl.getBoundingClientRect();
        const toX = targetRect.left + targetRect.width / 2;
        const toY = targetRect.top + targetRect.height / 2;

        // Pick representative origin cells from cleared coords or blasts.
        const pool =
          step.clearedCoords.length > 0
            ? step.clearedCoords
            : step.blasts.map((b) => ({ row: b.row, col: b.col }));
        if (pool.length === 0) continue;

        for (let i = 0; i < delta; i++) {
          const src = pool[Math.floor((i * pool.length) / delta)];
          const fromX = boardRect.left + (src.col + 0.5) * cellW;
          const fromY = boardRect.top + (src.row + 0.5) * cellH;
          spawned.push({
            id: flySeqRef.current++,
            fromX,
            fromY,
            toX,
            toY,
            arcY: -28 - (i % 3) * 14,
            kind: goal.kind,
            color: goal.color,
            skin,
            delayMs: i * 55,
          });
        }
      }

      if (bossDamaged) {
        setBossHitNonce((n) => n + 1);
      }
      if (hitGoalIds.length > 0) {
        window.setTimeout(() => {
          setBumpedGoals((prev) => {
            const next = { ...prev };
            for (const id of hitGoalIds) next[id] = (next[id] ?? 0) + 1;
            return next;
          });
        }, 380);
      }
      if (spawned.length > 0) {
        setFlyingGoals((prev) => [...prev.slice(-18), ...spawned]);
        const ids = new Set(spawned.map((t) => t.id));
        window.setTimeout(() => {
          setFlyingGoals((prev) => prev.filter((t) => !ids.has(t.id)));
        }, 680);
      }
    },
    []
  );

  const playSwapResult = useCallback(
    async (
      result: SwapResult,
      nextMovesCount: number,
      startingProgress: LevelProgress,
      startingEnergy: number,
      startingMaxCascade: number,
      currentEndlessTarget: number
    ) => {
      const token = ++runTokenRef.current;
      setBusy(true);
      setSelected(null);
      setHintPair(null);

      if (result.combo) {
        if (comboNoticeTimerRef.current !== null) {
          window.clearTimeout(comboNoticeTimerRef.current);
        }
        setComboNotice({ type: result.combo, nonce: Date.now() });
        soundEngine.playSpecialCreate('prism');
        comboNoticeTimerRef.current = window.setTimeout(() => {
          setComboNotice(null);
          comboNoticeTimerRef.current = null;
        }, 2400);
      }

      let runningProgress = startingProgress;
      let runningEnergy = startingEnergy;
      let runningMaxCascade = startingMaxCascade;
      let updatedMoves = nextMovesCount;
      let nextMilestone = currentEndlessTarget;

      for (const step of result.steps) {
        if (runTokenRef.current !== token) return false;

        // Show clear burst + audio + particle FX
        const clearSet = new Set(step.clearedCoords.map((pt) => `${pt.row},${pt.col}`));
        setClearingKeys(clearSet);
        setLastCascade(step.cascadeIndex);
        runningMaxCascade = Math.max(runningMaxCascade, step.cascadeIndex);
        setMaxCascade(runningMaxCascade);

        soundEngine.playMatch(step.cascadeIndex, step.clearedCoords.length);
        if (step.cascadeIndex === 2) {
          soundEngine.playCascadeCrystalBells(step.cascadeIndex);
        }
        if (step.spawnedSpecials.length > 0) {
          soundEngine.playSpecialCreate(step.spawnedSpecials[0].special);
        }

        const hasBeam = step.blasts.some((b) => b.type === 'beam_h' || b.type === 'beam_v');
        const hasNova = step.blasts.some((b) => b.type === 'nova');
        const hasPrism = step.blasts.some((b) => b.type === 'prism');
        const hasCrack = step.blasts.some(
          (b) => b.type === 'ice' || b.type === 'crate' || b.type === 'honey'
        );
        const hasScout = step.blasts.some((b) => b.type === 'scout');
        const hasEgg = step.blasts.some((b) => b.type === 'egg');
        if (hasEgg) soundEngine.playSpecialCreate('nova');

        if (hasPrism) {
          soundEngine.playBlast('prism');
          setShaking(true);
        } else if (hasNova) {
          soundEngine.playBlast('nova');
          setShaking(true);
        } else if (hasBeam) {
          soundEngine.playBlast('beam');
        } else if (hasScout) {
          soundEngine.playBlast('scout');
        } else if (hasCrack) {
          soundEngine.playBlast('crack');
        }

        if (hasPrism || hasNova || hasBeam) {
          vibrate('blast');
        } else if (step.spawnedSpecials.length > 0) {
          vibrate('special');
        } else {
          vibrate('match', step.cascadeIndex);
        }

        fxRef.current?.emitBlasts(step.blasts);

        await waitMs(230);
        if (runTokenRef.current !== token) return false;

        setClearingKeys(new Set());
        setShaking(false);
        setTransitionMode('fall');
        setBoard(step.boardAfterGravity);

        const prevStepProgress = runningProgress;
        const feverMult = feverMultiplier(feverRef.current);
        runningProgress = addStepDelta(runningProgress, step);
        if (feverMult > 1 && step.stepScore > 0) {
          runningProgress = {
            ...runningProgress,
            score: runningProgress.score + step.stepScore * (feverMult - 1),
          };
        }
        setProgress(runningProgress);
        emitGoalFlights(step, prevStepProgress, runningProgress, activeLevel);

        const achStep = applyStepToAchievements(achievementStateRef.current, step);
        achievementStateRef.current = achStep.nextState;
        writeAchievementState(achStep.nextState);
        setAchievementState(achStep.nextState);
        if (achStep.newlyUnlocked.length > 0) {
          notifyAchievements(achStep.newlyUnlocked);
        }

        if (result.totalEnergy > 0) {
          runningEnergy = Math.min(MAX_ENERGY, runningEnergy + step.energyGained);
          setEnergy(runningEnergy);
        }

        await waitMs(320);
      }

      if (runTokenRef.current !== token) return false;

      // End-of-move events (belts sliding, bombs ticking, new bombs and chains)
      // only exist on the final board, so always show it.
      if (!result.reshuffled) {
        const hasBelt = result.finalBoard.some((row) => row.some((cell) => cell.belt || cell.portal));
        setTransitionMode(hasBelt ? 'swap' : 'none');
        setBoard(result.finalBoard);
        if (hasBelt) {
          await waitMs(180);
          if (runTokenRef.current !== token) return false;
        }
      }

      // Album and weekly hunt: every animal cleared by this move counts.
      const collected: Partial<Record<GemColor, number>> = {};
      for (const step of result.steps) {
        for (const color of GEM_COLORS_ORDER) {
          const n = step.deltaProgress.clearedColors[color] ?? 0;
          if (n > 0) collected[color] = (collected[color] ?? 0) + n;
        }
      }
      const hunt = applyCollected(rewardStateRef.current, collected, weekKey);
      commitRewards(hunt.nextState);

      // The companion's power charges from every animal cleared (but not from
      // its own strike), and today's missions move forward.
      if (skipChargeRef.current) {
        skipChargeRef.current = false;
      } else {
        const gained = chargeFrom(collected, companion);
        if (gained > 0) setPowerCharge((charge) => Math.min(powerNeeded, charge + gained));
      }
      reportMission({
        cleared: collected,
        specials: result.steps.reduce((sum, step) => sum + step.spawnedSpecials.length, 0),
        cascades: result.steps.some((step) => step.cascadeIndex >= 3) ? 1 : 0,
        score: result.totalScore,
        blockers: result.steps.reduce(
          (sum, step) =>
            sum +
            step.deltaProgress.clearedIce +
            step.deltaProgress.clearedCrates +
            step.deltaProgress.clearedChains +
            step.deltaProgress.clearedHoney,
          0
        ),
      });
      if (season) {
        let total = 0;
        for (const color of GEM_COLORS_ORDER) total += collected[color] ?? 0;
        const event = applySeasonCollected(rewardStateRef.current, total, season.key, SEASON_TARGET);
        commitRewards(event.nextState);
        if (event.completed) {
          const granted = grantReward(dailyStateRef.current, SEASON_REWARD_ENERGY, season.season.skin);
          commitDaily(granted.nextState);
          soundEngine.playSpecialCreate('prism');
          setStatusNotice(
            t('{name} klar! +{n} energi och nytt djur-skin', {
              name: t(season.season.nameSv),
              n: SEASON_REWARD_ENERGY,
            })
          );
          window.setTimeout(() => {
            if (runTokenRef.current === token) setStatusNotice(null);
          }, 3200);
        }
      }
      if (hunt.weeklyCompleted) {
        const granted = grantReward(dailyStateRef.current, WEEKLY_REWARD_ENERGY, WEEKLY_SKIN);
        commitDaily(granted.nextState);
        soundEngine.playSpecialCreate('prism');
        setStatusNotice(
          granted.unlockedNewSkin
            ? t('Veckans jakt klar! +{n} energi och Kalashattar upplåsta', { n: WEEKLY_REWARD_ENERGY })
            : t('Veckans jakt klar! +{n} energi', { n: WEEKLY_REWARD_ENERGY })
        );
        window.setTimeout(() => {
          if (runTokenRef.current === token) setStatusNotice(null);
        }, 3200);
      }

      // Summarize the whole cascade in one floating label. Showing one label
      // per cascade step made fast chains overlap and become unreadable.
      const feverMultThisMove = feverMultiplier(feverRef.current);
      if (result.steps.length > 0) {
        const finalStep = result.steps[result.steps.length - 1];
        const anchor = finalStep.clearedCoords[Math.floor(finalStep.clearedCoords.length / 2)];
        const peakCascade = Math.max(...result.steps.map((step) => step.cascadeIndex));
        const specialsThisMove = result.steps.reduce((sum, step) => sum + step.spawnedSpecials.length, 0);

        if (anchor) {
          const totalStepScore =
            result.steps.reduce((sum, step) => sum + step.stepScore, 0) * feverMultThisMove;
          const cheerSource = cascadeCheer(peakCascade);
          const cheer = cheerSource ? t(cheerSource) : '';
          const formattedScore = formatNumber(totalStepScore);
          const feverTag = feverMultThisMove > 1 ? ' ×2' : '';
          const label = cheer
            ? `${cheer} ×${peakCascade}  +${formattedScore}${feverTag}`
            : `+${formattedScore}${feverTag}`;
          fxRef.current?.emitFloatingText(
            anchor.row,
            anchor.col,
            label,
            feverMultThisMove > 1 || peakCascade >= 2 ? '#FDE047' : '#FFFFFF'
          );
        }

        // Advance Fever (Frenzy) Mode meter
        if (mode !== 'puzzle' && mode !== 'custom') {
          const feverStep = advanceFever(feverRef.current, {
            peakCascade,
            specialsCreated: specialsThisMove,
            combo: result.combo ?? null,
          });
          commitFever(feverStep.nextState);
          if (feverStep.triggered) {
            soundEngine.playFeverTrigger();
            vibrate('victory');
            setStatusNotice(t('FEBERLÄGE! ×2 poäng i {n} drag!', { n: FEVER_DURATION_MOVES }));
            window.setTimeout(() => {
              if (runTokenRef.current === token) setStatusNotice(null);
            }, 2600);
          }
        }
      }

      if (result.honeySpread && !result.reshuffled) {
        // The honey crept over one more animal because none of it was cleared.
        setTransitionMode('none');
        setBoard(result.finalBoard);
        soundEngine.playBlast('crack');
        fxRef.current?.emitBlasts([
          { type: 'honey', row: result.honeySpread.row, col: result.honeySpread.col },
        ]);
      }

      if ((result.bossAttack || result.bombsPlanted) && !result.reshuffled) {
        setTransitionMode('none');
        setBoard(result.finalBoard);
        if (result.bossAttack) soundEngine.playBossGrowl();
        else soundEngine.playBlast('crack');
        vibrate('invalid');
        if (result.bossStole) {
          updatedMoves = Math.max(0, updatedMoves - result.bossStole);
          setMovesLeft(updatedMoves);
        }
        setStatusNotice(
          result.bossAttack
            ? t(BOSSES[biomeOfChapter(activeLevel.chapter ?? 1)].attackSv)
            : t('En bomb har dykt upp – matcha den i tid!')
        );
        window.setTimeout(() => {
          if (runTokenRef.current === token) setStatusNotice(null);
        }, 2000);
      }

      if (result.reshuffled) {
        setTransitionMode('none');
        setBoard(result.finalBoard);
        setStatusNotice(t('Inga fler drag — brädet blandades om automatiskt'));
        window.setTimeout(() => {
          if (runTokenRef.current === token) setStatusNotice(null);
        }, 2200);
      }

      // Endless milestone bonus moves
      if (mode === 'endless') {
        const milestones = applyEndlessMilestones(
          runningProgress.score,
          updatedMoves,
          nextMilestone
        );
        updatedMoves = milestones.movesLeft;
        nextMilestone = milestones.nextMilestone;
        setMovesLeft(updatedMoves);
        setEndlessTarget(nextMilestone);
      }

      // Halfway down, the boss loses its temper and starts attacking sooner.
      const bossGoal = activeLevel.boss ? activeLevel.objectives.find((o) => o.kind === 'boss') : undefined;
      if (bossGoal) {
        const before = getObjectiveCurrent(bossGoal, startingProgress);
        const after = getObjectiveCurrent(bossGoal, runningProgress);
        if (before * 2 < bossGoal.target && after * 2 >= bossGoal.target && after < bossGoal.target) {
          soundEngine.playBossGrowl();
          setShaking(true);
          window.setTimeout(() => setShaking(false), 420);
          setStatusNotice(t('{name} blir rasande!', { name: t(bossGoal.label) }));
          window.setTimeout(() => {
            if (runTokenRef.current === token) setStatusNotice(null);
          }, 2200);
        }
      }

      // Check victory (Campaign, Daily, Weekly, Daily Tactical Puzzle or Custom Puzzle)
      const currentObjectives =
        mode === 'campaign' || mode === 'daily' || mode === 'weekly' || mode === 'puzzle' || mode === 'custom'
          ? activeLevel.objectives
          : null;

      if (currentObjectives && areObjectivesComplete(currentObjectives, runningProgress)) {
        // Endgame celebration: turn leftover moves into festive board blasts!
        if (updatedMoves > 0 && mode !== 'puzzle' && mode !== 'custom' && !prefersReducedMotion()) {
          const celebrationCount = Math.min(6, updatedMoves);
          setStatusNotice(t('Segerbonus! Extra drag blir sprängningar!'));
          const celebrationBoard = cloneBoard(result.finalBoard);
          for (let i = 0; i < celebrationCount; i++) {
            if (runTokenRef.current !== token) return false;
            const r = Math.floor(Math.random() * 8);
            const c = Math.floor(Math.random() * 8);
            const blastKind = i % 3 === 0 ? 'nova' : i % 2 === 0 ? 'beam_h' : 'beam_v';
            if (celebrationBoard[r][c].gem) {
              celebrationBoard[r][c].gem!.special = blastKind;
              setTransitionMode('none');
              setBoard(cloneBoard(celebrationBoard));
            }
            soundEngine.playBlast(blastKind === 'nova' ? 'nova' : 'beam');
            fxRef.current?.emitBlasts([{ type: blastKind, row: r, col: c }]);
            fxRef.current?.emitFloatingText(r, c, '+200', '#FDE047');
            await waitMs(140);
          }
          if (runTokenRef.current !== token) return false;
        }

        const { specialBonus, bonus, stars } = computeVictoryBonus(
          result.finalBoard,
          updatedMoves,
          activeLevel.moves
        );
        const finalScore = runningProgress.score + bonus;
        const finalProgress = { ...runningProgress, score: finalScore };
        setProgress(finalProgress);

        const isMasterWin =
          mode === 'campaign' &&
          masterModeRef.current &&
          canPlayMasterMode(bestStars, activeLevel.id);
        let masterEnergy: number | undefined;

        if (mode === 'campaign') {
          const nextStars = mergeBestStars(bestStars, activeLevel.id, stars);
          if (nextStars !== bestStars) {
            setBestStars(nextStars);
            writeBestStars(nextStars);
          }
          if (isMasterWin) {
            const masterRes = recordMasterClear(masterCrownsRef.current, activeLevel.id, stars);
            if (masterRes.nextCrowns !== masterCrownsRef.current) {
              commitMasterCrowns(masterRes.nextCrowns);
            }
            if (masterRes.firstClear) {
              commitDaily(
                grantReward(dailyStateRef.current, MASTER_FIRST_CLEAR_ENERGY, null).nextState
              );
              masterEnergy = MASTER_FIRST_CLEAR_ENERGY;
            }
          }
          // Extend win streak, Star Chest, Star Race & Lava Trail!
          commitWinStreak(recordStreakWin(winStreakRef.current));
          commitStarChest(addChestStars(starChestRef.current, stars + (isMasterWin ? 1 : 0)));
          const nowTs = Date.now();
          let nextMini = addStarRaceStars(miniEventsRef.current, stars, nowTs);
          nextMini = recordLavaTrailWin(nextMini);
          if (nextMini !== miniEventsRef.current) commitMiniEvents(nextMini);
        } else if (mode === 'daily' || mode === 'weekly') {
          commitStarChest(addChestStars(starChestRef.current, stars));
          const nextMini = addStarRaceStars(miniEventsRef.current, stars, Date.now());
          if (nextMini !== miniEventsRef.current) commitMiniEvents(nextMini);
        }

        reportMission({ wins: 1, score: bonus });
        bumpStats({ gamesWon: 1, bossesBeaten: activeLevel.boss ? 1 : 0 });

        const nextBest = recordBestScore(finalScore);
        commitRewards(
          addTopScore(rewardStateRef.current, {
            score: finalScore,
            mode,
            level: mode === 'campaign' ? activeLevel.id : 0,
            dateKey: todayKey,
          })
        );

        // The weekly special level pays out once per week.
        let weeklyEnergy: number | undefined;
        if (mode === 'weekly') {
          weeklyEnergy = 0;
          if (!weeklyLevelRef.current.won) {
            commitWeeklyLevel({ ...weeklyLevelRef.current, won: true });
            commitDaily(grantReward(dailyStateRef.current, WEEKLY_LEVEL_ENERGY, null).nextState);
            weeklyEnergy = WEEKLY_LEVEL_ENERGY;
          }
        }

        // Daily tactical puzzle pays out once per day.
        let puzzleEnergy: number | undefined;
        let puzzleNewlySolved = false;
        if (mode === 'puzzle') {
          const solved = markDailyPuzzleSolved(dailyPuzzleStateRef.current, dailyPuzzle.dateKey);
          puzzleNewlySolved = solved.newlySolved;
          if (solved.newlySolved) {
            commitDailyPuzzle(solved.nextState);
            commitDaily(grantReward(dailyStateRef.current, DAILY_PUZZLE_REWARD_ENERGY, null).nextState);
            puzzleEnergy = DAILY_PUZZLE_REWARD_ENERGY;
          } else {
            puzzleEnergy = 0;
          }
        }

        // Weekly league points (Master Mode doubles points!).
        let leaguePoints = 0;
        if (mode === 'campaign') {
          leaguePoints = stars * 15 * (isMasterWin ? MASTER_LEAGUE_MULTIPLIER : 1);
        } else if (mode === 'daily') leaguePoints = 35;
        else if (mode === 'weekly') leaguePoints = 50;
        else if (mode === 'puzzle' && puzzleNewlySolved) leaguePoints = 30;
        if (leaguePoints > 0) awardLeague(leaguePoints);

        // A boss beaten for the first time gets a page in the story.
        if (mode === 'campaign' && activeLevel.boss && levelIdx + 1 > highestUnlockedIdx) {
          const chapter = activeLevel.chapter ?? 1;
          const biome = biomeOfChapter(chapter);
          setBossStory(bossPage(chapter, biome, BOSSES[biome].nameSv));
        }

        // The last level of a chapter hides a chest the first time it is won.
        let chest: EndSnapshot['chest'];
        if (
          mode === 'campaign' &&
          levelIdx + 1 > highestUnlockedIdx &&
          levelIdx % LEVELS_PER_CHAPTER === LEVELS_PER_CHAPTER - 1
        ) {
          const opened = openChest(rewardStateRef.current);
          commitRewards(opened.nextState);
          const granted = grantReward(dailyStateRef.current, CHEST_ENERGY, opened.skin);
          commitDaily(granted.nextState);
          chest = { energy: CHEST_ENERGY, skin: granted.unlockedNewSkin };
        }

        if (
          mode === 'campaign' &&
          levelIdx + 1 > highestUnlockedIdx &&
          levelIdx + 1 < CAMPAIGN_LEVEL_COUNT
        ) {
          setHighestUnlockedIdx(levelIdx + 1);
          writeInt(STORAGE_KEYS.unlocked, levelIdx + 1);
        }

        let nextDailyCount = dailyState.completedDates.length;
        if (mode === 'daily') {
          const claimed = claimDailyReward(
            dailyStateRef.current,
            dailyChallenge.dateKey,
            dailyChallenge.featuredSkin,
            dailyChallenge.rewardEnergy
          );
          nextDailyCount = claimed.nextState.completedDates.length;
          // A daily win a day keeps the streak going and raises the reward.
          let streak = rewardStateRef.current.streak;
          let streakEnergy = 0;
          let dailyNext = claimed.nextState;
          if (claimed.newlyCompleted) {
            const registered = registerDaily(rewardStateRef.current, dailyChallenge.dateKey);
            commitRewards(registered);
            streak = registered.streak;
            streakEnergy = streakBonus(streak);
            dailyNext = grantReward(dailyNext, streakEnergy, null).nextState;
          }
          commitDaily(dailyNext);
          setDailyReward({
            energyGranted: claimed.energyGranted,
            unlockedNewSkin: claimed.unlockedNewSkin,
            alreadyClaimed: !claimed.newlyCompleted,
            streak,
            streakEnergy,
          });
        }

        const achEnd = applyRunEndToAchievements(achievementStateRef.current, {
          wonCampaign: mode === 'campaign',
          dailyCompletedCount: nextDailyCount,
          bonusScore: bonus,
        });
        achievementStateRef.current = achEnd.nextState;
        writeAchievementState(achEnd.nextState);
        setAchievementState(achEnd.nextState);
        if (achEnd.newlyUnlocked.length > 0) {
          notifyAchievements(achEnd.newlyUnlocked);
        }

        await waitMs(320);
        if (runTokenRef.current !== token) return false;
        soundEngine.playVictory();
        vibrate('victory');
        setEndSnapshot({
          score: finalScore,
          best: nextBest,
          maxCascade: runningMaxCascade,
          movesLeft: updatedMoves,
          bonus,
          specialBonus,
          stars,
          chest,
          weeklyEnergy,
          puzzleEnergy,
          leaguePoints,
          masterEnergy,
          masterCleared: isMasterWin,
        });
        setBusy(false);
        setPhase('VICTORY');
        return true;
      }

      if (updatedMoves <= 0 || result.bombExploded) {
        if (result.bombExploded) {
          setTransitionMode('none');
          setBoard(result.finalBoard);
          soundEngine.playBlast('nova');
          fxRef.current?.emitBlasts([
            { type: 'nova', row: result.bombExploded.row, col: result.bombExploded.col },
          ]);
          setShaking(true);
          await waitMs(520);
          if (runTokenRef.current !== token) return false;
          setShaking(false);
        }
        // A failed campaign level costs a life and marks the win streak / lava
        // trail as pending reset (preserved if the player rescues with +5 moves).
        if (mode === 'campaign') {
          commitLives(loseLife(livesRef.current, Date.now()));
          if (winStreakRef.current.streak > 0 || miniEventsRef.current.lava.active) {
            pendingStreakLossRef.current = true;
          }
        }
        const best = recordBestScore(runningProgress.score);
        commitRewards(
          addTopScore(rewardStateRef.current, {
            score: runningProgress.score,
            mode,
            level: mode === 'campaign' ? activeLevel.id : 0,
            dateKey: todayKey,
          })
        );

        await waitMs(380);
        if (runTokenRef.current !== token) return false;
        soundEngine.playGameOver();
        vibrate('defeat');
        setEndSnapshot({
          score: runningProgress.score,
          best,
          maxCascade: runningMaxCascade,
          movesLeft: 0,
          bonus: 0,
          specialBonus: 0,
          stars: 0,
          lostToBomb: !!result.bombExploded,
        });
        setBusy(false);
        setPhase('GAME_OVER');
        return true;
      }

      setBusy(false);
      return true;
    },
    [
      activeLevel,
      awardLeague,
      bestStars,
      bumpStats,
      commitDaily,
      commitDailyPuzzle,
      commitFever,
      commitLives,
      commitMasterCrowns,
      commitMiniEvents,
      commitRewards,
      commitStarChest,
      commitWeeklyLevel,
      commitWinStreak,
      companion,
      dailyChallenge,
      dailyPuzzle,
      dailyState,
      emitGoalFlights,
      highestUnlockedIdx,
      levelIdx,
      mode,
      notifyAchievements,
      powerNeeded,
      recordBestScore,
      reportMission,
      season,
      todayKey,
      weekKey,
      weeklyLevel,
    ]
  );

  const flashInvalid = useCallback((a: Coord, b: Coord) => {
    soundEngine.playInvalidSwap();
    vibrate('invalid');
    setSelected(null);
    setInvalidPair([a, b]);
    window.setTimeout(() => setInvalidPair(null), 200);
  }, []);

  const attemptSwap = useCallback(
    async (a: Coord, b: Coord) => {
      if (busy || phase !== 'PLAYING') return;
      if (tutorialPrompt && !isMatchingTutorialSwap(a, b, tutorialPrompt.from, tutorialPrompt.to)) {
        flashInvalid(a, b);
        setStatusNotice(t('Följ guiden och byt de utpekade brickorna!'));
        return;
      }
      if (!canSwap(board, a, b)) {
        flashInvalid(a, b);
        return;
      }

      soundEngine.playSwap();
      vibrate('swap');
      const moveNumber = Math.max(1, activeLevel.moves - movesLeft + 1);
      // Seeded per move: the run replays exactly if the seed is known.
      const result = resolveSwap(
        board,
        a,
        b,
        levelColorPool(activeLevel),
        createSeededRng(`run-${runSeedRef.current}-${moveNumber}`),
        {
          level: activeLevel,
          moveNumber,
          enraged: isBossEnraged(activeLevel, progress),
        }
      );

      const swappedPreview = cloneBoard(board);
      const gemA = swappedPreview[a.row][a.col].gem;
      const gemB = swappedPreview[b.row][b.col].gem;
      swappedPreview[a.row][a.col].gem = gemB;
      swappedPreview[b.row][b.col].gem = gemA;

      if (!result.valid) {
        const token = ++runTokenRef.current;
        setBusy(true);
        setSelected(null);
        setTransitionMode('swap');
        setBoard(swappedPreview);
        await waitMs(230);
        if (runTokenRef.current !== token) return;

        soundEngine.playInvalidSwap();
        vibrate('invalid');
        setTransitionMode('swap');
        setBoard(board);
        setInvalidPair([a, b]);
        await waitMs(240);
        if (runTokenRef.current !== token) return;

        setInvalidPair(null);
        setBusy(false);
        return;
      }

      const tokenBefore = ++runTokenRef.current;
      const activeTutId = tutorialPrompt?.id ?? null;
      setBusy(true);
      setSelected(null);
      setHintPair(null);
      setTransitionMode('swap');
      setBoard(swappedPreview);
      await waitMs(260);
      if (runTokenRef.current !== tokenBefore) return;

      // The time mode is limited by the clock, not by moves.
      const nextMoves = mode === 'blitz' ? movesLeft : Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);
      bumpStats({ moves: 1 });
      const completed = await playSwapResult(
        result,
        nextMoves,
        progress,
        energy,
        maxCascade,
        endlessTarget
      );

      if (completed && activeTutId) {
        if (activeTutId === 'step1') {
          setTutorialStep('step2');
          setStatusNotice(t('Snyggt byte! Nu ska vi utlösa en kedjereaktion.'));
        } else if (activeTutId === 'step2') {
          setTutorialStep('done');
          setTutorialDone(true);
          writeFlag(STORAGE_KEYS.tutorialDone, true);
          setStatusNotice(t('Toppen! Du kan nu kedjereaktioner — fortsätt samla målen!'));
          window.setTimeout(() => setStatusNotice(null), 3600);
        }
      }
    },
    [
      activeLevel,
      board,
      bumpStats,
      busy,
      mode,
      endlessTarget,
      energy,
      flashInvalid,
      maxCascade,
      movesLeft,
      phase,
      playSwapResult,
      progress,
      tutorialPrompt,
    ]
  );

  const applyToolAt = useCallback(
    async (tool: ToolType, target: Coord | null) => {
      if (busy || phase !== 'PLAYING') return;
      const cost = TOOL_COSTS[tool];
      if (energy < cost) return;

      const result = applyTool(
        board,
        tool,
        target,
        levelColorPool(activeLevel),
        createSeededRng(`tool-${runSeedRef.current}-${mode}-${movesLeft}-${tool}`)
      );
      if (!result.valid) {
        soundEngine.playInvalidSwap();
        vibrate('invalid');
        return;
      }

      const remainingEnergy = Math.max(0, energy - cost);
      setEnergy(remainingEnergy);
      setActiveTool(null);

      if (tool === 'shuffle') {
        soundEngine.playClick();
        vibrate('swap');
        setTransitionMode('none');
        setBoard(result.finalBoard);
        setStatusNotice(t('Brädet blandades om'));
        window.setTimeout(() => setStatusNotice(null), 1600);
        return;
      }

      await playSwapResult(
        result,
        movesLeft,
        progress,
        remainingEnergy,
        maxCascade,
        endlessTarget
      );
    },
    [
      activeLevel,
      board,
      busy,
      endlessTarget,
      energy,
      maxCascade,
      movesLeft,
      phase,
      playSwapResult,
      progress,
    ]
  );

  /** Fires the companion's power once it is fully charged. Costs no move. */
  const firePower = useCallback(async () => {
    if (busy || phase !== 'PLAYING' || tutorialPrompt || powerCharge < powerNeeded) return;
    const def = getCompanion(companion);
    setPowerCharge(0);
    setActiveTool(null);
    setSelected(null);
    bumpStats({ powersUsed: 1 });
    reportMission({ powers: 1 });
    soundEngine.playAnimalVoice(GEM_COLORS_ORDER.indexOf(companion));
    vibrate('victory');
    setStatusNotice(`${t(def.powerSv)}!`);
    window.setTimeout(() => setStatusNotice(null), 1800);

    // Powers grow at level 5 and 10.
    const tier = powerTier(companionLevel);
    const extra = (tier - 1) * TIER_EXTRA_COUNT;
    if (def.power === 'moves') {
      if (mode === 'blitz') setBlitzLeft((left) => left + 8 + extra * 3);
      else setMovesLeft((moves) => moves + 3 + extra);
      return;
    }
    if (def.power === 'specials') {
      const planted = plantBeams(board, 3 + extra);
      setTransitionMode('none');
      setBoard(planted.board);
      fxRef.current?.emitBlasts(planted.spots.map((spot) => ({ type: 'match' as const, row: spot.row, col: spot.col })));
      return;
    }
    const targets = powerTargets(board, def.power, Math.random, tier);
    const result = clearCells(board, targets, levelColorPool(activeLevel));
    if (!result.valid || result.steps.length === 0) return;
    skipChargeRef.current = true;
    await playSwapResult(result, movesLeft, progress, energy, maxCascade, endlessTarget);
  }, [
    activeLevel,
    board,
    bumpStats,
    busy,
    companion,
    companionLevel,
    endlessTarget,
    energy,
    maxCascade,
    mode,
    movesLeft,
    phase,
    playSwapResult,
    powerCharge,
    powerNeeded,
    progress,
    reportMission,
    tutorialPrompt,
  ]);

  // Time mode: when the clock runs out (and the board has settled) the round ends.
  useEffect(() => {
    if (mode !== 'blitz' || phase !== 'PLAYING' || blitzLeft > 0 || busy) return;
    runTokenRef.current += 1;
    const score = progress.score;
    const res = addBlitzScore(blitzRef.current, score);
    blitzRef.current = res.nextState;
    setBlitz(res.nextState);
    writeBlitz(res.nextState);
    commitRewards(addTopScore(rewardStateRef.current, { score, mode: 'blitz', level: 0, dateKey: todayKey }));
    const leaguePts = Math.min(40, Math.floor(score / 250));
    if (leaguePts > 0) awardLeague(leaguePts);
    if (isCloudConfigured(cloudConfigRef.current) && score > 0) {
      void submitGlobalScore(cloudConfigRef.current, {
        board: 'blitz',
        periodKey: weekKey,
        playerId: playerProfileRef.current.playerId,
        handle: playerProfileRef.current.handle || t('Du'),
        color: companion,
        score: res.nextState.best,
      });
    }
    soundEngine.playVictory();
    vibrate('victory');
    setEndSnapshot({
      score,
      best: res.nextState.best,
      maxCascade,
      movesLeft: 0,
      bonus: 0,
      specialBonus: 0,
      stars: 0,
      blitzRank: res.rank,
      leaguePoints: leaguePts,
      ...(challenge ? { challengeScore: challenge.score } : {}),
    });
    setPhase('GAME_OVER');
  }, [awardLeague, blitzLeft, busy, challenge, commitRewards, maxCascade, mode, phase, progress.score, todayKey]);

  const selectTool = useCallback(
    (tool: ToolType) => {
      if (busy || phase !== 'PLAYING') return;
      const cost = TOOL_COSTS[tool];
      if (energy < cost) return;

      if (tool === 'shuffle') {
        void applyToolAt('shuffle', null);
        return;
      }

      soundEngine.playClick();
      setSelected(null);
      setActiveTool((curr) => (curr === tool ? null : tool));
    },
    [busy, energy, phase, applyToolAt]
  );

  const clickCell = useCallback(
    (coord: Coord) => {
      if (busy || phase !== 'PLAYING') return;

      if (activeTool) {
        void applyToolAt(activeTool, coord);
        return;
      }

      if (tutorialPrompt) {
        const isFrom =
          coord.row === tutorialPrompt.from.row && coord.col === tutorialPrompt.from.col;
        const isTo =
          coord.row === tutorialPrompt.to.row && coord.col === tutorialPrompt.to.col;
        if (!isFrom && !isTo) {
          soundEngine.playInvalidSwap();
          setInvalidPair([coord, coord]);
          setStatusNotice(t('Peka på en av de utpekade brickorna!'));
          window.setTimeout(() => setInvalidPair(null), 200);
          return;
        }
      }

      const cell = board[coord.row][coord.col];
      if (cell.crate > 0 || !cell.gem || cell.gem.chained) {
        soundEngine.playInvalidSwap();
        setSelected(null);
        return;
      }

      if (!selected) {
        soundEngine.playClick();
        vibrate('tap');
        setSelected(coord);
        return;
      }

      if (selected.row === coord.row && selected.col === coord.col) {
        setSelected(null);
        return;
      }

      const dist = Math.abs(selected.row - coord.row) + Math.abs(selected.col - coord.col);
      if (dist === 1) {
        void attemptSwap(selected, coord);
      } else {
        soundEngine.playClick();
        vibrate('tap');
        setSelected(coord);
      }
    },
    [activeTool, attemptSwap, board, busy, phase, selected, tutorialPrompt, applyToolAt]
  );

  const showHint = useCallback(() => {
    if (busy || phase !== 'PLAYING') return;
    const best = findBestHint(board);
    if (best) {
      soundEngine.playClick();
      setHintPair([best.from, best.to]);
      window.setTimeout(() => {
        setHintPair((curr) =>
          curr && curr[0].row === best.from.row && curr[0].col === best.from.col ? null : curr
        );
      }, 4000);
    }
  }, [board, busy, phase]);

  // --- Sharing -------------------------------------------------------------

  const shareResult = useCallback(async () => {
    soundEngine.playClick();
    const text = buildShareText({
      mode,
      won: phase === 'VICTORY',
      levelNumber: activeLevel.id,
      levelName: activeLevel.name,
      dateKey: todayKey,
      stars: endSnapshot.stars,
      score: endSnapshot.score,
      maxCascade: endSnapshot.maxCascade,
      url:
        mode === 'blitz' && blitzSeedRef.current
          ? challengeUrl(getShareUrl(), { seed: blitzSeedRef.current, score: endSnapshot.score })
          : mode === 'custom' && activeCustomPuzzleRef.current
          ? customPuzzleUrl(getShareUrl(), activeCustomPuzzleRef.current)
          : getShareUrl(),
    });
    const outcome = await shareText(text);
    setShareNotice(
      outcome === 'copied'
        ? t('Resultatet är kopierat – klistra in det var du vill!')
        : outcome === 'shared'
        ? t('Delat!')
        : outcome === 'failed'
        ? t('Det gick inte att dela från den här webbläsaren.')
        : null
    );
  }, [activeLevel.id, activeLevel.name, endSnapshot, mode, phase, todayKey]);

  const bossEnraged = isBossEnraged(activeLevel, progress);
  const movesUntilBoss = activeLevel.boss
    ? movesUntilBossAttack(
        activeLevel.boss.every,
        Math.max(0, activeLevel.moves - movesLeft),
        bossEnraged
      )
    : null;

  const rescueCostNow = rescueCost(rescuesUsed);
  const rescueEligible = isRescuableMode(mode) && rescuesUsed < MAX_RESCUES_PER_RUN;
  const canRescue = canAffordRescue(mode, rescuesUsed, dailyState.bonusEnergyBank, energy);

  const playerHandleLabel = playerProfile.handle || t('Du');
  const leagueStandings = useMemo(
    () => buildLeagueStandings(league, playerHandleLabel, companion),
    [companion, language, league, playerHandleLabel]
  );

  const starRaceStandings = useMemo(
    () =>
      miniEvents.race
        ? buildStarRaceStandings(miniEvents.race, playerHandleLabel, companion, Date.now())
        : null,
    [companion, miniEvents.race, playerHandleLabel]
  );

  return {
    // session
    phase,
    mode,
    levelIdx,
    activeLevel,
    highestUnlockedIdx,
    bestStars,
    bestEndlessScore,
    endSnapshot,
    savedGame,
    // new pro features
    fever,
    feverActive: isFeverActive(fever),
    freeStarters,
    starChest,
    canSpinToday: canSpinWheel(starChest, todayKey),
    claimStarChestReward,
    spinLuckyWheel,
    miniEvents,
    starRaceStandings,
    beginStarRace,
    claimRaceReward,
    beginLavaTrail,
    claimLavaReward,
    masterModeEnabled,
    toggleMasterMode,
    masterCrowns,
    sharedCustomPuzzle,
    activeCustomPuzzle,
    startCustomPuzzle,
    dismissSharedCustomPuzzle,
    playerProfile,
    updatePlayerHandle,
    cloudConfig,
    cloudConnected: isCloudConfigured(cloudConfig),
    saveCloudSettings,
    globalLeague,
    globalBlitz,
    refreshGlobalBoard,
    // daily + cosmetics
    dailyChallenge,
    dailyCompletedToday,
    dailyState,
    dailyReward,
    rewardState,
    weeklyQuest,
    weekKey,
    todayKey,
    lives,
    buyLives,
    season,
    companion,
    powerCharge,
    powerNeeded,
    selectCompanion,
    firePower,
    missions,
    missionState,
    stats,
    island,
    buildNext,
    collectIslandGift,
    upgradeNext,
    calendar,
    claimLoginGift,
    pass,
    claimPassRewards,
    challenge,
    dismissChallenge,
    startChallenge,
    companionSay,
    startWeekly,
    startDailyPuzzle,
    dailyPuzzle,
    dailyPuzzleState,
    dailyPuzzleSolvedToday,
    winStreak,
    armedStarters,
    toggleStarter,
    rescueCostNow,
    rescueEligible,
    canRescue,
    rescueRun,
    league,
    leagueStandings,
    claimWeeklyLeagueReward,
    activeObstacleIntro,
    dismissObstacleIntro,
    flyingGoals,
    bumpedGoals,
    bossHitNonce,
    movesUntilBoss,
    companionLevel,
    weeklyLevel: weeklyLevel.level,
    weeklyLevelState,
    bossStoryPage: phase === 'VICTORY' ? null : bossStory,
    closeBossStory,
    bossEnraged,
    storyPage,
    closeStory,
    readStory,
    seenPages,
    blitz,
    blitzLeft,
    // board
    board,
    transitionMode,
    movesLeft,
    progress,
    energy,
    lastCascade,
    selected,
    hintPair,
    clearingKeys,
    invalidPair,
    activeTool,
    shaking,
    busy,
    fxRef,
    // messages
    tutorialPrompt,
    statusNotice,
    comboNotice,
    shareNotice,
    showGuide,
    achievementState,
    achievementToast,
    // actions
    selectMode,
    selectLevel,
    equipSkin,
    openGuide,
    closeGuide,
    startSelected,
    resumeSaved,
    restart,
    nextLevel,
    replayTutorial,
    skipTutorial,
    backToTitle,
    pause,
    resume,
    attemptSwap,
    selectTool,
    clickCell,
    showHint,
    shareResult,
  };
}
