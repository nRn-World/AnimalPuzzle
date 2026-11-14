import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AchievementUnlockToast } from './components/AchievementsSection';
import { BoardTransitionMode, GameBoard } from './components/GameBoard';
import { GameHud } from './components/GameHud';
import { DailyRewardResult, GameModals } from './components/GameModals';
import { HowToPlayGuide } from './components/HowToPlayGuide';
import { ParticleCanvasHandle } from './components/ParticleCanvas';
import { TitleScreen } from './components/TitleScreen';
import {
  AchievementDef,
  AchievementSaveState,
  applyRunEndToAchievements,
  applyStepToAchievements,
  readAchievementState,
  writeAchievementState,
} from './game/achievements';
import { soundEngine } from './game/audio';
import {
  claimDailyReward,
  consumeBonusEnergy,
  createInitialDailyState,
  createSeededRng,
  DailySaveState,
  equipAnimalSkin,
  getDailyChallenge,
  getDailyKey,
  MAX_ENERGY_BANK,
} from './game/daily';
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
} from './game/engine';
import {
  createTutorialBoard,
  isMatchingTutorialSwap,
  resolveTutorialPrompt,
  shouldRunTutorial,
  TUTORIAL_STORAGE_KEY,
  TutorialStepId,
} from './game/tutorial';
import {
  isDocumentFullscreen,
  isFullscreenSupported,
  toggleDocumentFullscreen,
} from './game/fullscreen';
import { CAMPAIGN_LEVELS, ENDLESS_CONFIG } from './game/levels';
import { BEST_SCORE_STORAGE_KEYS, nextBestScore } from './game/records';
import {
  AnimalSkinId,
  Board,
  CascadeStep,
  ComboType,
  Coord,
  GEM_COLORS_ORDER,
  GameMode,
  GamePhase,
  LevelConfig,
  LevelProgress,
  SwapResult,
  TOOL_COSTS,
  ToolType,
} from './game/types';
import {
  computeStars,
  mergeBestStars,
  readBestStars,
  writeBestStars,
} from './game/mastery';

const MAX_ENERGY = 100;
const DAILY_STORAGE_KEY = 'kromatik_daily_state';

const COMBO_COPY: Record<ComboType, { title: string; sub: string }> = {
  crossbeam: { title: 'KORSSTRÅLE', sub: 'Två strålar korsar hela brädet' },
  supernova: { title: 'SUPERNOVA', sub: 'Dubbel nova – ett enormt genombrott' },
  starburst: { title: 'STJÄRNFALL', sub: 'Nova och stråle i perfekt harmoni' },
  prism: { title: 'PRISMJAKT', sub: 'Hela färgen dras in i prismat' },
  prism_beam: { title: 'PRISMSTRÅLE', sub: 'Alla djur av färgen blir strålar' },
  prism_nova: { title: 'PRISMNOVA', sub: 'Alla djur av färgen exploderar' },
  prism_storm: { title: 'PRISMSTORM', sub: 'Hela brädet rensas i ett svep' },
};

function readStoredInt(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeStoredInt(key: string, val: number): void {
  try {
    window.localStorage.setItem(key, String(Math.round(val)));
  } catch {
    // ignore storage failures
  }
}

function readDailyState(): DailySaveState {
  const initial = createInitialDailyState();
  try {
    const raw = window.localStorage.getItem(DAILY_STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<DailySaveState>;
    const validSkins: AnimalSkinId[] = ['classic', 'royal', 'winter', 'starlight'];
    const unlocked: AnimalSkinId[] = Array.isArray(parsed.unlockedSkins)
      ? parsed.unlockedSkins.filter((s): s is AnimalSkinId => validSkins.includes(s as AnimalSkinId))
      : ['classic'];
    if (!unlocked.includes('classic')) unlocked.unshift('classic');
    const equipped =
      parsed.equippedSkin && unlocked.includes(parsed.equippedSkin as AnimalSkinId)
        ? (parsed.equippedSkin as AnimalSkinId)
        : 'classic';
    return {
      completedDates: Array.isArray(parsed.completedDates)
        ? parsed.completedDates.filter((d): d is string => typeof d === 'string')
        : [],
      bonusEnergyBank:
        typeof parsed.bonusEnergyBank === 'number' && Number.isFinite(parsed.bonusEnergyBank)
          ? Math.max(0, Math.round(parsed.bonusEnergyBank))
          : 0,
      unlockedSkins: unlocked,
      equippedSkin: equipped,
    };
  } catch {
    return initial;
  }
}

function writeDailyState(state: DailySaveState): void {
  try {
    window.localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function readTutorialDone(): boolean {
  try {
    return window.localStorage.getItem(TUTORIAL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeTutorialDone(done: boolean): void {
  try {
    if (done) {
      window.localStorage.setItem(TUTORIAL_STORAGE_KEY, '1');
    } else {
      window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

function addStepDelta(prev: LevelProgress, step: CascadeStep): LevelProgress {
  const nextColors = { ...prev.clearedColors };
  for (const color of GEM_COLORS_ORDER) {
    nextColors[color] = (nextColors[color] ?? 0) + (step.deltaProgress.clearedColors[color] ?? 0);
  }
  return {
    score: prev.score + step.stepScore,
    clearedColors: nextColors,
    clearedIce: prev.clearedIce + step.deltaProgress.clearedIce,
    clearedCrates: prev.clearedCrates + step.deltaProgress.clearedCrates,
    clearedChains: prev.clearedChains + step.deltaProgress.clearedChains,
    specialsCreated: prev.specialsCreated + step.spawnedSpecials.length,
    cascade3Count: prev.cascade3Count + (step.cascadeIndex === 3 ? 1 : 0),
  };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const INTRO_GUIDE_SEEN_KEY = 'kromatik_intro_guide_seen_v1';

function hasSeenIntroGuide(): boolean {
  try {
    return window.localStorage.getItem(INTRO_GUIDE_SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' ? 'PLAYING' : 'TITLE_MENU';
  });

  const [mode, setMode] = useState<GameMode>('campaign');
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [highestUnlockedIdx, setHighestUnlockedIdx] = useState<number>(() =>
    Math.min(CAMPAIGN_LEVELS.length - 1, Math.max(0, readStoredInt('kromatik_unlocked', 0)))
  );
  const [bestCampaignScore, setBestCampaignScore] = useState<number>(() =>
    readStoredInt(BEST_SCORE_STORAGE_KEYS.campaign, 0)
  );
  const [bestEndlessScore, setBestEndlessScore] = useState<number>(() =>
    readStoredInt(BEST_SCORE_STORAGE_KEYS.endless, 0)
  );
  const [bestDailyScore, setBestDailyScore] = useState<number>(() =>
    readStoredInt(BEST_SCORE_STORAGE_KEYS.daily, 0)
  );

  const [dailyState, setDailyState] = useState<DailySaveState>(() => readDailyState());
  const dailyStateRef = useRef(dailyState);
  dailyStateRef.current = dailyState;
  const todayKey = useMemo(() => getDailyKey(), []);
  const dailyChallenge = useMemo(() => getDailyChallenge(todayKey), [todayKey]);
  const dailyCompletedToday = dailyState.completedDates.includes(todayKey);

  const [endlessTarget, setEndlessTarget] = useState<number>(2500);
  const activeLevel: LevelConfig =
    mode === 'campaign'
      ? CAMPAIGN_LEVELS[levelIdx] ?? CAMPAIGN_LEVELS[0]
      : mode === 'daily'
      ? dailyChallenge.level
      : {
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

  const [tutorialDone, setTutorialDone] = useState<boolean>(() => readTutorialDone());
  const [tutorialStep, setTutorialStep] = useState<TutorialStepId>(() =>
    !readTutorialDone() ? 'step1' : 'done'
  );

  const [board, setBoard] = useState<Board>(() =>
    !readTutorialDone() ? createTutorialBoard() : createBoard(CAMPAIGN_LEVELS[0])
  );
  const [transitionMode, setTransitionMode] = useState<BoardTransitionMode>('none');
  const [movesLeft, setMovesLeft] = useState<number>(CAMPAIGN_LEVELS[0].moves);
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
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isDocumentFullscreen());
  const canFullscreen = useMemo(() => isFullscreenSupported(), []);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [dailyReward, setDailyReward] = useState<DailyRewardResult | null>(null);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const tutorialPrompt = useMemo(
    () => (mode === 'campaign' && tutorialStep !== 'done' ? resolveTutorialPrompt(tutorialStep, board) : null),
    [board, mode, tutorialStep]
  );

  const [endSnapshot, setEndSnapshot] = useState<{
    score: number;
    best: number;
    maxCascade: number;
    movesLeft: number;
    bonus: number;
    specialBonus: number;
    stars: number;
  }>({
    score: 0,
    best: 0,
    maxCascade: 1,
    movesLeft: 0,
    bonus: 0,
    specialBonus: 0,
    stars: 1,
  });

  const [bestStars, setBestStars] = useState<Record<number, number>>(() => readBestStars());
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
  const boardStageRef = useRef<HTMLDivElement | null>(null);
  const [boardSide, setBoardSide] = useState<number>(480);
  const runTokenRef = useRef<number>(0);

  // Fit the board to the viewport: the square pedestal always fills the free space.
  useEffect(() => {
    if (phase !== 'PLAYING' && phase !== 'PAUSED') return;
    const stage = boardStageRef.current;
    if (!stage) return;

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      // Reserve room for the active-tool hint line above the pedestal.
      const side = Math.floor(Math.min(rect.width, rect.height - 26));
      setBoardSide(Math.max(220, side));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    window.addEventListener('orientationchange', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, [phase]);

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

  // Sync game state to document.body.dataset.state
  useEffect(() => {
    const mapped =
      phase === 'TITLE_MENU'
        ? 'title'
        : phase === 'PLAYING'
        ? 'playing'
        : phase === 'PAUSED'
        ? 'paused'
        : 'gameover';
    document.body.dataset.state = mapped;
  }, [phase]);

  const handleEquipSkin = useCallback((skin: AnimalSkinId) => {
    setDailyState((prev) => {
      const next = equipAnimalSkin(prev, skin);
      writeDailyState(next);
      return next;
    });
    soundEngine.playClick();
  }, []);

  const handleCloseGuide = useCallback(() => {
    setShowGuide(false);
    try {
      window.localStorage.setItem(INTRO_GUIDE_SEEN_KEY, '1');
    } catch {
      // Private mode or blocked storage: the guide simply shows again next time.
    }
  }, []);

  const startSession = useCallback(
    (
      targetMode: GameMode,
      targetIdx: number,
      forceTutorial = false,
      playIntro = false,
      skipTutorial = false
    ) => {
      runTokenRef.current += 1;
      const lvl =
        targetMode === 'campaign'
          ? CAMPAIGN_LEVELS[targetIdx] ?? CAMPAIGN_LEVELS[0]
          : targetMode === 'daily'
          ? dailyChallenge.level
          : ENDLESS_CONFIG;

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
      setShowGuide(
        playIntro &&
          targetMode === 'campaign' &&
          (forceTutorial || !hasSeenIntroGuide())
      );

      // Load banked bonus energy into campaign/endless starts. Skipping the
      // tutorial restarts the same run, so keep the energy already earned in it.
      let startingEnergy = 0;
      if (skipTutorial) {
        startingEnergy = energy;
      } else if (targetMode !== 'daily' && dailyState.bonusEnergyBank > 0) {
        const consumed = consumeBonusEnergy(dailyState, MAX_ENERGY);
        startingEnergy = consumed.loadedEnergy;
        setDailyState(consumed.nextState);
        writeDailyState(consumed.nextState);
      }

      clearComboNotice();
      setMode(targetMode);
      setLevelIdx(targetIdx);
      setEndlessTarget(2500);
      setTransitionMode('none');
      setTutorialStep(runTutorial ? 'step1' : 'done');
      setBoard(
        runTutorial
          ? createTutorialBoard()
          : targetMode === 'daily'
          ? createBoard(lvl, createSeededRng(dailyChallenge.seed))
          : createBoard(lvl)
      );
      setMovesLeft(lvl.moves);
      setProgress(createEmptyProgress());
      setEnergy(startingEnergy);
      setLastCascade(1);
      setMaxCascade(1);
      setSelected(null);
      setHintPair(null);
      setClearingKeys(new Set());
      setInvalidPair(null);
      setActiveTool(null);
      setShaking(false);
      setBusy(false);
      setDailyReward(null);
      setStatusNotice(
        startingEnergy > 0 ? `Bonusenergi aktiverad: +${startingEnergy}` : null
      );
      setPhase('PLAYING');
    },
    [clearComboNotice, dailyChallenge, dailyState, energy, tutorialDone]
  );

  const handleSkipTutorial = useCallback(() => {
    soundEngine.playClick();
    setTutorialStep('done');
    setTutorialDone(true);
    writeTutorialDone(true);
    startSession('campaign', levelIdx, false, false, true);
    setStatusNotice('Guide hoppad över — spela fritt!');
    window.setTimeout(() => setStatusNotice(null), 2000);
  }, [levelIdx, startSession]);

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
        const hasCrack = step.blasts.some((b) => b.type === 'ice' || b.type === 'crate');

        if (hasPrism) {
          soundEngine.playBlast('prism');
          setShaking(true);
        } else if (hasNova) {
          soundEngine.playBlast('nova');
          setShaking(true);
        } else if (hasBeam) {
          soundEngine.playBlast('beam');
        } else if (hasCrack) {
          soundEngine.playBlast('crack');
        }

        fxRef.current?.emitBlasts(step.blasts);
        if (step.clearedCoords.length > 0) {
          const anchor = step.clearedCoords[Math.floor(step.clearedCoords.length / 2)];
          const cheer =
            step.cascadeIndex >= 5
              ? 'OTROLIGT!'
              : step.cascadeIndex === 4
              ? 'MAGISKT!'
              : step.cascadeIndex === 3
              ? 'SUPER!'
              : step.cascadeIndex === 2
              ? 'KASKAD!'
              : '';
          const label = cheer ? `${cheer} +${step.stepScore}` : `+${step.stepScore}`;
          const textColor =
            step.cascadeIndex >= 3 ? '#FDE047' : step.cascadeIndex === 2 ? '#6EE7B7' : '#FFFFFF';
          fxRef.current?.emitFloatingText(anchor.row, anchor.col, label, textColor);
        }

        await waitMs(230);
        if (runTokenRef.current !== token) return false;

        setClearingKeys(new Set());
        setShaking(false);
        setTransitionMode('fall');
        setBoard(step.boardAfterGravity);

        runningProgress = addStepDelta(runningProgress, step);
        setProgress(runningProgress);

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

      if (result.reshuffled) {
        setTransitionMode('none');
        setBoard(result.finalBoard);
        setStatusNotice('Inga fler drag — brädet blandades om automatiskt');
        window.setTimeout(() => {
          if (runTokenRef.current === token) setStatusNotice(null);
        }, 2200);
      }

      // Endless milestone bonus moves
      if (mode === 'endless') {
        while (runningProgress.score >= nextMilestone) {
          updatedMoves += 5;
          nextMilestone += 2500;
        }
        setMovesLeft(updatedMoves);
        setEndlessTarget(nextMilestone);
      }

      // Check victory (Campaign or Daily)
      const currentObjectives =
        mode === 'campaign'
          ? CAMPAIGN_LEVELS[levelIdx].objectives
          : mode === 'daily'
          ? dailyChallenge.level.objectives
          : null;

      if (currentObjectives && areObjectivesComplete(currentObjectives, runningProgress)) {
        let leftoverSpecials = 0;
        for (const row of result.finalBoard) {
          for (const cell of row) {
            if (cell.gem && cell.gem.special !== 'none') leftoverSpecials++;
          }
        }
        const specialBonus = leftoverSpecials * 150;
        const bonus = updatedMoves * 120 + specialBonus;
        const stars = computeStars(updatedMoves, activeLevel.moves);
        const finalScore = runningProgress.score + bonus;
        const finalProgress = { ...runningProgress, score: finalScore };
        setProgress(finalProgress);

        if (mode === 'campaign') {
          const nextStars = mergeBestStars(bestStars, activeLevel.id, stars);
          if (nextStars !== bestStars) {
            setBestStars(nextStars);
            writeBestStars(nextStars);
          }
        }

        const record = nextBestScore(
          {
            campaign: bestCampaignScore,
            daily: bestDailyScore,
            endless: bestEndlessScore,
          },
          mode,
          finalScore
        );
        const nextBest = record.best;
        if (record.mode === 'campaign') {
          setBestCampaignScore(nextBest);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.campaign, nextBest);
        } else if (record.mode === 'daily') {
          setBestDailyScore(nextBest);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.daily, nextBest);
        } else {
          setBestEndlessScore(nextBest);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.endless, nextBest);
        }

        if (mode === 'campaign' && levelIdx + 1 > highestUnlockedIdx && levelIdx + 1 < CAMPAIGN_LEVELS.length) {
          setHighestUnlockedIdx(levelIdx + 1);
          writeStoredInt('kromatik_unlocked', levelIdx + 1);
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
          setDailyState(claimed.nextState);
          writeDailyState(claimed.nextState);
          setDailyReward({
            energyGranted: claimed.energyGranted,
            unlockedNewSkin: claimed.unlockedNewSkin,
            alreadyClaimed: !claimed.newlyCompleted,
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
        setEndSnapshot({
          score: finalScore,
          best: nextBest,
          maxCascade: runningMaxCascade,
          movesLeft: updatedMoves,
          bonus,
          specialBonus,
          stars,
        });
        setBusy(false);
        setPhase('VICTORY');
        return true;
      }

      if (updatedMoves <= 0) {
        const record = nextBestScore(
          {
            campaign: bestCampaignScore,
            daily: bestDailyScore,
            endless: bestEndlessScore,
          },
          mode,
          runningProgress.score
        );
        const best = record.best;
        if (record.mode === 'endless') {
          setBestEndlessScore(best);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.endless, best);
        } else if (record.mode === 'daily') {
          setBestDailyScore(best);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.daily, best);
        } else {
          setBestCampaignScore(best);
          writeStoredInt(BEST_SCORE_STORAGE_KEYS.campaign, best);
        }

        await waitMs(380);
        if (runTokenRef.current !== token) return false;
        soundEngine.playGameOver();
        setEndSnapshot({
          score: runningProgress.score,
          best,
          maxCascade: runningMaxCascade,
          movesLeft: 0,
          bonus: 0,
          specialBonus: 0,
          stars: 0,
        });
        setBusy(false);
        setPhase('GAME_OVER');
        return true;
      }

      setBusy(false);
      return true;
    },
    [
      activeLevel.id,
      activeLevel.moves,
      bestCampaignScore,
      bestDailyScore,
      bestEndlessScore,
      bestStars,
      dailyChallenge,
      dailyState,
      highestUnlockedIdx,
      levelIdx,
      mode,
      notifyAchievements,
    ]
  );

  const attemptSwap = useCallback(
    async (a: Coord, b: Coord) => {
      if (busy || phase !== 'PLAYING') return;
      if (tutorialPrompt && !isMatchingTutorialSwap(a, b, tutorialPrompt.from, tutorialPrompt.to)) {
        soundEngine.playInvalidSwap();
        setSelected(null);
        setInvalidPair([a, b]);
        setStatusNotice('Följ guiden och byt de utpekade brickorna!');
        window.setTimeout(() => setInvalidPair(null), 200);
        return;
      }
      if (!canSwap(board, a, b)) {
        soundEngine.playInvalidSwap();
        setSelected(null);
        setInvalidPair([a, b]);
        window.setTimeout(() => setInvalidPair(null), 200);
        return;
      }

      soundEngine.playSwap();
      const result = resolveSwap(board, a, b, levelColorPool(activeLevel));

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

      const nextMoves = Math.max(0, movesLeft - 1);
      setMovesLeft(nextMoves);
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
          setStatusNotice('Snyggt byte! Nu ska vi utlösa en kedjereaktion.');
        } else if (activeTutId === 'step2') {
          setTutorialStep('done');
          setTutorialDone(true);
          writeTutorialDone(true);
          setStatusNotice('Toppen! Du kan nu kedjereaktioner — fortsätt samla målen!');
          window.setTimeout(() => setStatusNotice(null), 3600);
        }
      }
    },
    [
      activeLevel.colorCount,
      board,
      busy,
      endlessTarget,
      energy,
      maxCascade,
      movesLeft,
      phase,
      playSwapResult,
      progress,
      tutorialPrompt,
    ]
  );

  const handleUseTool = useCallback(
    async (tool: ToolType, target: Coord | null) => {
      if (busy || phase !== 'PLAYING') return;
      const cost = TOOL_COSTS[tool];
      if (energy < cost) return;

      const result = applyTool(board, tool, target, levelColorPool(activeLevel));
      if (!result.valid) {
        soundEngine.playInvalidSwap();
        return;
      }

      const remainingEnergy = Math.max(0, energy - cost);
      setEnergy(remainingEnergy);
      setActiveTool(null);

      if (tool === 'shuffle') {
        soundEngine.playClick();
        setTransitionMode('none');
        setBoard(result.finalBoard);
        setStatusNotice('Brädet blandades om');
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
      activeLevel.colorCount,
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

  const handleSelectTool = useCallback(
    (tool: ToolType) => {
      if (busy || phase !== 'PLAYING') return;
      const cost = TOOL_COSTS[tool];
      if (energy < cost) return;

      if (tool === 'shuffle') {
        handleUseTool('shuffle', null);
        return;
      }

      soundEngine.playClick();
      setSelected(null);
      setActiveTool((curr) => (curr === tool ? null : tool));
    },
    [busy, energy, handleUseTool, phase]
  );

  const handleCellClick = useCallback(
    (coord: Coord) => {
      if (busy || phase !== 'PLAYING') return;

      if (activeTool) {
        handleUseTool(activeTool, coord);
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
          setStatusNotice('Peka på en av de utpekade brickorna!');
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
        setSelected(coord);
        return;
      }

      if (selected.row === coord.row && selected.col === coord.col) {
        setSelected(null);
        return;
      }

      const dist = Math.abs(selected.row - coord.row) + Math.abs(selected.col - coord.col);
      if (dist === 1) {
        attemptSwap(selected, coord);
      } else {
        soundEngine.playClick();
        setSelected(coord);
      }
    },
    [activeTool, attemptSwap, board, busy, handleUseTool, phase, selected, tutorialPrompt]
  );

  const handleHint = useCallback(() => {
    if (busy || phase !== 'PLAYING') return;
    const best = findBestHint(board);
    if (best) {
      soundEngine.playClick();
      setHintPair([best.from, best.to]);
      window.setTimeout(() => {
        setHintPair((curr) =>
          curr &&
          curr[0].row === best.from.row &&
          curr[0].col === best.from.col
            ? null
            : curr
        );
      }, 2400);
    }
  }, [board, busy, phase]);

  const handleToggleMute = useCallback(() => {
    setMuted(soundEngine.toggleMute());
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    soundEngine.playClick();
    void toggleDocumentFullscreen().then((next) => {
      setIsFullscreen(next);
    });
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(isDocumentFullscreen());
    };
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  // Keyboard shortcuts during PLAYING / PAUSED
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (phase === 'PLAYING') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          if (busy) return;
          setPhase('PAUSED');
        } else if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          handleHint();
        } else if (e.key === 'm' || e.key === 'M') {
          e.preventDefault();
          handleToggleMute();
        } else if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          handleToggleFullscreen();
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          startSession(mode, levelIdx);
        } else if (e.key === '1') {
          e.preventDefault();
          handleSelectTool('hammer');
        } else if (e.key === '2') {
          e.preventDefault();
          handleSelectTool('pulse');
        } else if (e.key === '3') {
          e.preventDefault();
          handleSelectTool('shuffle');
        }
      } else if (phase === 'PAUSED') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          e.preventDefault();
          setPhase('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    busy,
    handleHint,
    handleSelectTool,
    handleToggleFullscreen,
    handleToggleMute,
    levelIdx,
    mode,
    phase,
    startSession,
  ]);

  return (
    <>
      <AchievementUnlockToast achievement={achievementToast} />
      <HowToPlayGuide open={showGuide} onClose={handleCloseGuide} />

      {phase === 'TITLE_MENU' ? (
                  <TitleScreen
            mode={mode}
            selectedLevelIdx={levelIdx}
            highestUnlockedIdx={highestUnlockedIdx}
            bestStars={bestStars}
            bestEndlessScore={bestEndlessScore}
          dailyChallenge={dailyChallenge}
          dailyCompletedToday={dailyCompletedToday}
          bonusEnergyBank={dailyState.bonusEnergyBank}
          unlockedSkins={dailyState.unlockedSkins}
          equippedSkin={dailyState.equippedSkin}
          achievementState={achievementState}
          isFullscreen={isFullscreen}
          canFullscreen={canFullscreen}
          onSelectMode={(m) => {
            soundEngine.playClick();
            setMode(m);
          }}
          onSelectLevel={(idx) => {
            soundEngine.playClick();
            setLevelIdx(idx);
          }}
          onEquipSkin={handleEquipSkin}
          onToggleFullscreen={handleToggleFullscreen}
          guideOpen={showGuide}
          onShowGuide={() => {
            soundEngine.playClick();
            setShowGuide(true);
          }}
          onStart={() => {
            if (showGuide) return;
            soundEngine.playClick();
            startSession(mode, levelIdx, false, true);
          }}
        />
      ) : (
        <div className="fixed inset-0 z-10 flex flex-col overflow-hidden bg-[#0B1018]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-10%,#1B2540_0%,#0C1220_55%,#070A11_100%)]" />
          <div className="relative flex min-h-0 flex-1 flex-col items-stretch gap-1.5 px-2 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.6rem,env(safe-area-inset-bottom))] pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] sm:px-4 sm:py-3 lg:flex-row lg:gap-4 lg:px-5 lg:py-4">
            <GameHud
              level={activeLevel}
              mode={mode}
              skin={dailyState.equippedSkin}
              movesLeft={movesLeft}
              progress={progress}
              energy={energy}
              maxEnergy={MAX_ENERGY}
              lastCascade={lastCascade}
              activeTool={activeTool}
              muted={muted}
              isFullscreen={isFullscreen}
              canFullscreen={canFullscreen}
              busy={busy}
              onSelectTool={handleSelectTool}
              onHint={handleHint}
              onToggleMute={handleToggleMute}
              onToggleFullscreen={handleToggleFullscreen}
              onPause={() => {
                if (busy) return;
                soundEngine.playClick();
                setPhase('PAUSED');
              }}
              onRestart={() => {
                soundEngine.playClick();
                startSession(mode, levelIdx);
              }}
            />

            <div className="order-2 lg:order-none flex min-h-0 w-full flex-1 flex-col items-center gap-1.5 sm:gap-2">
              {tutorialPrompt && (
                <div
                  data-testid="tutorial-banner"
                  className="w-full max-w-[min(94vw,460px)] sm:max-w-[512px] bg-gradient-to-b from-[#1E273B] to-[#151C2B] border border-[#F5B841]/70 border-b-[3px] border-b-[#9A6A12] rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2.5 shadow-lg flex items-center sm:items-start justify-between gap-2.5 sm:gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#FDE047] truncate">
                      {tutorialPrompt.titleSv}
                    </div>
                    <p className="text-[11px] sm:text-sm font-medium text-white leading-tight sm:leading-snug line-clamp-3 sm:line-clamp-none">
                      {tutorialPrompt.instructionSv}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="tutorial-skip"
                    onClick={handleSkipTutorial}
                    className="shrink-0 px-2.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-white bg-[#29344E] hover:bg-[#354363] rounded-lg border border-white/15 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Hoppa över
                  </button>
                </div>
              )}

              <div
                ref={boardStageRef}
                className="relative flex min-h-0 w-full flex-1 items-center justify-center"
              >
                {comboNotice && (
                  <div
                    key={comboNotice.nonce}
                    data-testid="combo-banner"
                    className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-3"
                  >
                    <div className="animate-combo-banner rounded-xl border border-[#F5B841]/70 border-b-[3px] border-b-[#9A6A12] bg-gradient-to-b from-[#2C2416]/96 to-[#171208]/96 px-4 py-1.5 text-center shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                      <div className="font-display text-sm sm:text-base font-bold tracking-wide text-[#FDE047]">
                        {COMBO_COPY[comboNotice.type].title}
                      </div>
                      <div className="text-[10px] sm:text-xs font-semibold text-[#F1F5F9]">
                        {COMBO_COPY[comboNotice.type].sub}
                      </div>
                    </div>
                  </div>
                )}
                <GameBoard
                  board={board}
                  transitionMode={transitionMode}
                  skin={dailyState.equippedSkin}
                  selected={selected}
                  hintPair={hintPair}
                  tutorialPrompt={tutorialPrompt}
                  clearingKeys={clearingKeys}
                  invalidPair={invalidPair}
                  activeTool={activeTool}
                  shaking={shaking}
                  busy={busy}
                  fxRef={fxRef}
                  onCellClick={handleCellClick}
                  onSwipeSwap={attemptSwap}
                  size={boardSide}
                />
              </div>

              {statusNotice && (
                <div className="flex min-h-4 sm:min-h-5 items-center justify-center text-center">
                  <span className="text-[11px] sm:text-xs font-semibold text-[#FDE047] truncate max-w-[92vw]">
                    {statusNotice}
                  </span>
                </div>
              )}
            </div>
          </div>

          <GameModals
            phase={phase}
            mode={mode}
            levelNumber={activeLevel.id}
            levelName={activeLevel.name}
            hasNextLevel={mode === 'campaign' && levelIdx + 1 < CAMPAIGN_LEVELS.length}
            snapshotScore={endSnapshot.score}
            bestScore={endSnapshot.best}
            maxCascade={endSnapshot.maxCascade}
            movesLeft={endSnapshot.movesLeft}
            bonusScore={endSnapshot.bonus}
            specialBonus={endSnapshot.specialBonus}
            stars={endSnapshot.stars}
            totalMoves={activeLevel.moves}
            dailyReward={dailyReward}
            onEquipSkin={handleEquipSkin}
            onReplayTutorial={() => {
              soundEngine.playClick();
              startSession('campaign', 0, true, true);
            }}
            onResume={() => {
              soundEngine.playClick();
              setPhase('PLAYING');
            }}
            onRestart={() => {
              soundEngine.playClick();
              startSession(mode, levelIdx);
            }}
            onNextLevel={() => {
              soundEngine.playClick();
              startSession('campaign', Math.min(CAMPAIGN_LEVELS.length - 1, levelIdx + 1));
            }}
            onBackToTitle={() => {
              runTokenRef.current += 1;
              clearComboNotice();
              soundEngine.playClick();
              setShowGuide(false);
              setPhase('TITLE_MENU');
            }}
          />
        </div>
      )}
    </>
  );
}
