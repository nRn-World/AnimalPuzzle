import { lazy, Suspense } from 'react';
import { StoryModal } from './components/StoryModal';
import { useReminders } from './hooks/useReminders';
import titleBackdrop from './assets/images/title-backdrop.webp';
import { useCallback, useEffect, useState } from 'react';
import { AchievementUnlockToast } from './components/AchievementsSection';
import { ComboBanner } from './components/ComboBanner';
import { FlyingGoalsOverlay } from './components/FlyingGoalsOverlay';
import { GameBoard } from './components/GameBoard';
import { GameHud } from './components/GameHud';
import { GameModals } from './components/GameModals';
import { ObstacleIntroModal } from './components/ObstacleIntroModal';
import { TitleScreen } from './components/TitleScreen';
import { TutorialBanner } from './components/TutorialBanner';
import { soundEngine } from './game/audio';
import { biomeOfChapter } from './game/biomes';
import { CAMPAIGN_LEVEL_COUNT } from './game/levels';
import { useBoardSize } from './hooks/useBoardSize';
import { useFullscreen } from './hooks/useFullscreen';
import { MAX_ENERGY, useGameSession } from './hooks/useGameSession';
import { useSettings } from './hooks/useSettings';

const HowToPlayGuide = lazy(() => import('./components/HowToPlayGuide').then((m) => ({ default: m.HowToPlayGuide })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal })));

export default function App() {
  // Subscribing here re-renders the whole tree when the language changes.
  const settings = useSettings();
  const game = useGameSession(settings.language);
  useReminders(settings.reminders, game.lives);
  const { isFullscreen, canFullscreen, enterFullscreen, toggleFullscreen } = useFullscreen();

  // Go true full screen when entering the playfield on both desktop web and mobile.
  const enterPlayFullscreen = useCallback(() => {
    enterFullscreen();
  }, [enterFullscreen]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    phase,
    mode,
    levelIdx,
    activeLevel,
    busy,
    showGuide,
    pause,
    resume,
    restart,
    showHint,
    selectTool,
  } = game;

  const inGame = phase !== 'TITLE_MENU';
  const { boardStageRef, boardSide, boardHeight } = useBoardSize(inGame);

  const toggleMute = useCallback(() => {
    soundEngine.toggleMute();
  }, []);

  const openSettings = useCallback(() => {
    soundEngine.playClick();
    setSettingsOpen(true);
  }, []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);

  // Browsers only allow audio after a user gesture: unlock on the first one.
  useEffect(() => {
    const unlock = () => soundEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Expose the coarse game state for styling and automated tests.
  useEffect(() => {
    document.body.dataset.state =
      phase === 'TITLE_MENU'
        ? 'title'
        : phase === 'PLAYING'
        ? 'playing'
        : phase === 'PAUSED'
        ? 'paused'
        : 'gameover';
  }, [phase]);

  // Keyboard shortcuts during PLAYING / PAUSED
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Dialogs on top of the game handle their own keys.
      if (settingsOpen || showGuide || game.activeObstacleIntro) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toLowerCase();

      if (phase === 'PLAYING') {
        if (key === 'p' || key === 'escape') {
          e.preventDefault();
          if (!busy) pause();
        } else if (key === 'h') {
          e.preventDefault();
          showHint();
        } else if (key === 'm') {
          e.preventDefault();
          toggleMute();
        } else if (key === 'f') {
          e.preventDefault();
          toggleFullscreen();
        } else if (key === 'r') {
          e.preventDefault();
          restart();
        } else if (key === '1') {
          e.preventDefault();
          selectTool('hammer');
        } else if (key === '2') {
          e.preventDefault();
          selectTool('pulse');
        } else if (key === '3') {
          e.preventDefault();
          selectTool('shuffle');
        }
      } else if (phase === 'PAUSED') {
        if (key === 'p' || key === 'escape') {
          e.preventDefault();
          resume();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    busy,
    game.activeObstacleIntro,
    pause,
    phase,
    restart,
    resume,
    selectTool,
    settingsOpen,
    showGuide,
    showHint,
    toggleFullscreen,
    toggleMute,
  ]);

  return (
    <>
      <AchievementUnlockToast achievement={game.achievementToast} />
      {/* Loaded after the first paint: neither is needed to show the menu */}
      <Suspense fallback={null}>
        <HowToPlayGuide open={showGuide} onClose={game.closeGuide} />
        <SettingsModal open={settingsOpen} onClose={closeSettings} />
      </Suspense>

      {!inGame ? (
        <TitleScreen
          mode={mode}
          selectedLevelIdx={levelIdx}
          highestUnlockedIdx={game.highestUnlockedIdx}
          bestStars={game.bestStars}
          bestEndlessScore={game.bestEndlessScore}
          dailyChallenge={game.dailyChallenge}
          dailyCompletedToday={game.dailyCompletedToday}
          bonusEnergyBank={game.dailyState.bonusEnergyBank}
          unlockedSkins={game.dailyState.unlockedSkins}
          equippedSkin={game.dailyState.equippedSkin}
          achievementState={game.achievementState}
          rewardState={game.rewardState}
          weeklyQuest={game.weeklyQuest}
          todayKey={game.todayKey}
          lives={game.lives}
          onBuyLives={game.buyLives}
            missions={game.missions}
            missionState={game.missionState}
            companion={game.companion}
            onSelectCompanion={game.selectCompanion}
            island={game.island}
            onBuild={game.buildNext}
            onCollectGift={game.collectIslandGift}
            onUpgrade={game.upgradeNext}
            calendar={game.calendar}
            onClaimCalendar={game.claimLoginGift}
            pass={game.pass}
            onClaimPass={game.claimPassRewards}
            challenge={game.challenge}
            onStartChallenge={() => {
              enterPlayFullscreen();
              game.startChallenge();
            }}
            onDismissChallenge={game.dismissChallenge}
            weeklyLevel={game.weeklyLevel}
            weeklyLevelState={game.weeklyLevelState}
            onStartWeekly={() => {
              enterPlayFullscreen();
              game.startWeekly();
            }}
            dailyPuzzle={game.dailyPuzzle}
            dailyPuzzleSolvedToday={game.dailyPuzzleSolvedToday}
            onStartDailyPuzzle={() => {
              enterPlayFullscreen();
              game.startDailyPuzzle();
            }}
            winStreak={game.winStreak}
            armedStarters={game.armedStarters}
            onToggleStarter={game.toggleStarter}
            league={game.league}
            leagueStandings={game.leagueStandings}
            onClaimLeagueReward={game.claimWeeklyLeagueReward}
            stats={game.stats}
            blitz={game.blitz}
            storyPage={game.bossStoryPage ?? game.storyPage}
            onCloseStory={game.bossStoryPage ? game.closeBossStory : game.closeStory}
            onReadStory={game.readStory}
            seenPages={game.seenPages}
          season={game.season}
          isFullscreen={isFullscreen}
          canFullscreen={canFullscreen}
          guideOpen={showGuide || settingsOpen}
          savedGame={game.savedGame}
          onResumeSaved={() => {
            enterPlayFullscreen();
            game.resumeSaved();
          }}
          onOpenSettings={openSettings}
          onSelectMode={game.selectMode}
          onSelectLevel={game.selectLevel}
          onEquipSkin={game.equipSkin}
          onToggleFullscreen={toggleFullscreen}
          onShowGuide={game.openGuide}
          onStart={() => {
            enterPlayFullscreen();
            game.startSelected();
          }}
        />
      ) : (
        <div className="fixed inset-0 z-10 flex h-[100dvh] w-full flex-col overflow-hidden ui-scene">
          {/* Scenery behind the board, dimmed so the animals stay in focus */}
          <img
            src={titleBackdrop}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-[#0B101A]/45" />
          <div className="ui-play-shell relative flex min-h-0 flex-1">
            <GameHud
              level={activeLevel}
              mode={mode}
              skin={game.dailyState.equippedSkin}
              movesLeft={game.movesLeft}
              progress={game.progress}
              energy={game.energy}
              maxEnergy={MAX_ENERGY}
              lastCascade={game.lastCascade}
              activeTool={game.activeTool}
              muted={settings.muted}
              isFullscreen={isFullscreen}
              canFullscreen={canFullscreen}
              busy={busy}
              timeLeft={mode === 'blitz' ? game.blitzLeft : undefined}
              bossEnraged={game.bossEnraged}
              movesUntilBoss={game.movesUntilBoss}
              bossHitNonce={game.bossHitNonce}
              bumpedGoals={game.bumpedGoals}
              winStreak={game.winStreak.streak}
              companion={game.companion}
              companionSay={game.companionSay}
              powerCharge={game.powerCharge}
              powerNeeded={game.powerNeeded}
              onFirePower={game.firePower}
              onSelectTool={selectTool}
              onHint={showHint}
              onToggleMute={toggleMute}
              onToggleFullscreen={toggleFullscreen}
              onPause={pause}
              onRestart={restart}
              onBackToTitle={game.backToTitle}
            />

            <div className="ui-play-center order-2 flex min-h-0 min-w-0 flex-1 flex-col items-center gap-1">
              {game.tutorialPrompt && (
                <TutorialBanner prompt={game.tutorialPrompt} onSkip={game.skipTutorial} />
              )}

              <div
                ref={boardStageRef}
                className="relative flex min-h-0 w-full flex-1 items-center justify-center"
              >
                {game.comboNotice && (
                  <ComboBanner key={game.comboNotice.nonce} type={game.comboNotice.type} />
                )}
                <GameBoard
                  board={game.board}
                  transitionMode={game.transitionMode}
                  skin={game.dailyState.equippedSkin}
                  selected={game.selected}
                  hintPair={game.hintPair}
                  tutorialPrompt={game.tutorialPrompt}
                  clearingKeys={game.clearingKeys}
                  invalidPair={game.invalidPair}
                  activeTool={game.activeTool}
                  shaking={game.shaking}
                  busy={busy}
                  cheering={phase === 'VICTORY'}
                  fxRef={game.fxRef}
                  onCellClick={game.clickCell}
                  onSwipeSwap={game.attemptSwap}
                  size={boardSide}
                  height={boardHeight}
                />
                {game.statusNotice && (
                  <div
                    role="status"
                    className="pointer-events-none absolute inset-x-0 bottom-2 z-40 flex justify-center px-2"
                  >
                    <span className="max-w-[92%] truncate rounded-full border-2 border-[#111111] bg-[#111111]/88 px-3 py-1 text-[11px] sm:text-xs font-extrabold text-[#FDE047] shadow-[2px_2px_0_#111111]">
                      {game.statusNotice}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <FlyingGoalsOverlay tokens={game.flyingGoals} />
          <ObstacleIntroModal
            intro={game.activeObstacleIntro}
            biome={biomeOfChapter(activeLevel.chapter ?? 1)}
            onDismiss={game.dismissObstacleIntro}
          />
          <StoryModal
            page={game.bossStoryPage}
            skin={game.dailyState.equippedSkin}
            onClose={game.closeBossStory}
          />
          <GameModals
            phase={phase}
            mode={mode}
            levelNumber={activeLevel.id}
            levelName={activeLevel.name}
            hasNextLevel={mode === 'campaign' && levelIdx + 1 < CAMPAIGN_LEVEL_COUNT}
            snapshotScore={game.endSnapshot.score}
            bestScore={game.endSnapshot.best}
            maxCascade={game.endSnapshot.maxCascade}
            movesLeft={game.endSnapshot.movesLeft}
            bonusScore={game.endSnapshot.bonus}
            specialBonus={game.endSnapshot.specialBonus}
            stars={game.endSnapshot.stars}
            chest={game.endSnapshot.chest}
            lostToBomb={game.endSnapshot.lostToBomb}
            blitzRank={game.endSnapshot.blitzRank}
            challengeScore={game.endSnapshot.challengeScore}
            weeklyEnergy={game.endSnapshot.weeklyEnergy}
            puzzleEnergy={game.endSnapshot.puzzleEnergy}
            leaguePoints={game.endSnapshot.leaguePoints}
            winStreak={game.winStreak.streak}
            rescueCost={game.rescueCostNow}
            rescueEligible={game.rescueEligible}
            canRescue={game.canRescue}
            onRescue={game.rescueRun}
            livesLeft={game.lives.lives}
            totalMoves={activeLevel.moves}
            dailyReward={game.dailyReward}
            shareNotice={game.shareNotice}
            isFullscreen={isFullscreen}
            canFullscreen={canFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onShare={game.shareResult}
            onOpenSettings={openSettings}
            onEquipSkin={game.equipSkin}
            onReplayTutorial={game.replayTutorial}
            onResume={resume}
            onRestart={restart}
            onNextLevel={game.nextLevel}
            onBackToTitle={game.backToTitle}
          />
        </div>
      )}
    </>
  );
}
