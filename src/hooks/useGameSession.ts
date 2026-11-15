import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  claimDailyReward,
  consumeBonusEnergy,
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
  applyTool,
  areObjectivesComplete,
  canSwap,
  cloneBoard,
  createBoard,
  createEmptyProgress,
  findBestHint,
  levelColorPool,
  resolveSwap,
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
  SwapResult,
  TOOL_COSTS,
  ToolType,
} from '../game/types';
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
  const commitDaily = useCallback((next: DailySaveState) => {
    dailyStateRef.current = next;
    setDailyState(next);
    writeDailyState(next);
  }, []);
  const weekKey = useMemo(() => getWeekKey(), []);
  const weeklyQuest = useMemo(() => getWeeklyQuest(weekKey), [weekKey]);

  const [endlessTarget, setEndlessTarget] = useState<number>(ENDLESS_MILESTONE_STEP);
  const activeLevel: LevelConfig = useMemo(
    () =>
      mode === 'campaign'
        ? getCampaignLevel(levelIdx)
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
          },
    [dailyChallenge, endlessTarget, levelIdx, mode]
  );

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

  const selectLevel = useCallback((idx: number) => {
    soundEngine.playClick();
    setLevelIdx(idx);
  }, []);

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
    soundEngine.playClick();
    setShowGuide(false);
    setShareNotice(null);
    setSavedGame(loadResumableSave(highestUnlockedIdx, todayKey));
    setPhase('TITLE_MENU');
  }, [clearComboNotice, highestUnlockedIdx, todayKey]);

  /** Clears every transient board interaction; shared by start and resume. */
  const resetInteraction = useCallback(() => {
    clearComboNotice();
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
  }, [clearComboNotice]);

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
          ? getCampaignLevel(targetIdx)
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
          (forceTutorial || !readFlag(STORAGE_KEYS.introGuideSeen))
      );

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

      resetInteraction();
      setMode(targetMode);
      setLevelIdx(targetIdx);
      setEndlessTarget(ENDLESS_MILESTONE_STEP);
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
      setMaxCascade(1);
      setStatusNotice(
        startingEnergy > 0 ? t('Bonusenergi aktiverad: +{n}', { n: startingEnergy }) : null
      );
      setPhase('PLAYING');
    },
    [dailyChallenge, dailyState, energy, resetInteraction, tutorialDone]
  );

  const startSelected = useCallback(() => {
    if (showGuide) return;
    soundEngine.playClick();
    startSession(mode, levelIdx, false, true);
  }, [levelIdx, mode, showGuide, startSession]);

  const restart = useCallback(() => {
    soundEngine.playClick();
    startSession(mode, levelIdx);
  }, [levelIdx, mode, startSession]);

  const nextLevel = useCallback(() => {
    soundEngine.playClick();
    startSession('campaign', Math.min(CAMPAIGN_LEVEL_COUNT - 1, levelIdx + 1));
  }, [levelIdx, startSession]);

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
    setMode(save.mode);
    if (save.mode === 'campaign') setLevelIdx(save.levelIdx);
    setEndlessTarget(save.endlessTarget);
    setTutorialStep('done');
    setBoard(save.board);
    setMovesLeft(save.movesLeft);
    setProgress(save.progress);
    setEnergy(save.energy);
    setMaxCascade(save.maxCascade);
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
      if (result.steps.length > 0) {
        const finalStep = result.steps[result.steps.length - 1];
        const anchor = finalStep.clearedCoords[Math.floor(finalStep.clearedCoords.length / 2)];
        if (anchor) {
          const peakCascade = Math.max(...result.steps.map((step) => step.cascadeIndex));
          const totalStepScore = result.steps.reduce((sum, step) => sum + step.stepScore, 0);
          const cheerSource = cascadeCheer(peakCascade);
          const cheer = cheerSource ? t(cheerSource) : '';
          const formattedScore = formatNumber(totalStepScore);
          const label = cheer
            ? `${cheer} ×${peakCascade}  +${formattedScore}`
            : `+${formattedScore}`;
          fxRef.current?.emitFloatingText(
            anchor.row,
            anchor.col,
            label,
            peakCascade >= 2 ? '#FDE047' : '#FFFFFF'
          );
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

      // Check victory (Campaign or Daily)
      const currentObjectives =
        mode === 'campaign'
          ? getCampaignLevel(levelIdx).objectives
          : mode === 'daily'
          ? dailyChallenge.level.objectives
          : null;

      if (currentObjectives && areObjectivesComplete(currentObjectives, runningProgress)) {
        const { specialBonus, bonus, stars } = computeVictoryBonus(
          result.finalBoard,
          updatedMoves,
          activeLevel.moves
        );
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

        const nextBest = recordBestScore(finalScore);
        commitRewards(
          addTopScore(rewardStateRef.current, {
            score: finalScore,
            mode,
            level: mode === 'campaign' ? activeLevel.id : 0,
            dateKey: todayKey,
          })
        );

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
        });
        setBusy(false);
        setPhase('VICTORY');
        return true;
      }

      if (updatedMoves <= 0) {
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
      bestStars,
      dailyChallenge,
      dailyState,
      highestUnlockedIdx,
      levelIdx,
      mode,
      notifyAchievements,
      recordBestScore,
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
      busy,
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

      const result = applyTool(board, tool, target, levelColorPool(activeLevel));
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
      url: getShareUrl(),
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
    // daily + cosmetics
    dailyChallenge,
    dailyCompletedToday,
    dailyState,
    dailyReward,
    rewardState,
    weeklyQuest,
    weekKey,
    todayKey,
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
