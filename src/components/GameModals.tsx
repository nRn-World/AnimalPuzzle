import React, { useEffect, useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { formatNumber, t } from '../i18n';
import { AnimalSkinId, GameMode, GamePhase } from '../game/types';
import { getSkinMeta } from '../game/daily';
import { nextStarGoal } from '../game/mastery';
import { GemSvg } from './GemSvg';
import { StarRating } from './StarRating';
import { UiIcon } from './UiIcon';

export interface DailyRewardResult {
  energyGranted: number;
  unlockedNewSkin: AnimalSkinId | null;
  alreadyClaimed: boolean;
  /** Days in a row with a completed daily challenge, including today. */
  streak?: number;
  /** Extra energy the streak added on top of the daily reward. */
  streakEnergy?: number;
}

interface GameModalsProps {
  phase: GamePhase;
  mode: GameMode;
  levelNumber: number;
  levelName: string;
  hasNextLevel: boolean;
  snapshotScore: number;
  bestScore: number;
  maxCascade: number;
  movesLeft: number;
  bonusScore: number;
  specialBonus: number;
  stars: number;
  totalMoves: number;
  dailyReward: DailyRewardResult | null;
  /** Chapter chest opened by this win, if any. */
  chest?: { energy: number; skin: AnimalSkinId | null };
  /** The level was lost to a bomb rather than running out of moves. */
  lostToBomb?: boolean;
  /** Time mode: place on this week's list (0 = outside it). */
  blitzRank?: number;
  /** A friend's score that this time-mode round was played against. */
  challengeScore?: number;
  /** Weekly special level: energy paid for this win (0 = already won this week). */
  weeklyEnergy?: number;
  /** Daily tactical puzzle: energy paid for today's solve (0 = already solved). */
  puzzleEnergy?: number;
  /** Weekly league points earned from this round. */
  leaguePoints?: number;
  /** Current campaign win streak count. */
  winStreak?: number;
  /** Cost in energy to rescue a Game Over run with +5 moves. */
  rescueCost?: number;
  /** Whether Rescue (+5 moves) is available in this mode / attempt count. */
  rescueEligible?: boolean;
  /** Whether the player currently has enough energy to rescue. */
  canRescue?: boolean;
  onRescue?: () => void;
  /** Lives left (campaign only). */
  livesLeft?: number;
  isFullscreen?: boolean;
  canFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onEquipSkin: (skin: AnimalSkinId) => void;
  /** Feedback after the share button was used; null while idle. */
  shareNotice: string | null;
  onShare: () => void;
  onOpenSettings: () => void;
  onReplayTutorial?: () => void;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onBackToTitle: () => void;
}

/** Counts up to `value` in under a second; jumps straight there with reduced motion. */
const CountUp: React.FC<{ value: number }> = ({ value }) => {
  const { reduceMotion } = useSettings();
  const [shown, setShown] = useState(reduceMotion ? value : 0);
  useEffect(() => {
    if (reduceMotion || value <= 0) {
      setShown(value);
      return;
    }
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 900);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);
  return <>{formatNumber(shown)}</>;
};

const CONFETTI_COLORS = ['#FF2E4D', '#27B8FF', '#6FE65E', '#F2CD1C', '#FF8AD1', '#FFFFFF'];

/** Paper confetti raining over the whole screen behind the dialog. */
const Confetti: React.FC = () => (
  <div className="ui-confetti" aria-hidden="true">
    {Array.from({ length: 36 }, (_, i) => (
      <i
        key={i}
        style={{
          left: `${(i * 37 + 11) % 100}%`,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${-((i * 0.41) % 3.4)}s`,
          animationDuration: `${2.6 + ((i * 7) % 5) * 0.32}s`,
          width: 7 + (i % 3) * 3,
          height: 11 + (i % 4) * 2,
        }}
      />
    ))}
  </div>
);

export const HeartIcon: React.FC<{ className?: string; empty?: boolean }> = ({ className, empty }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M12 21 C5 15.5 2 12 2 8 C2 5 4.3 3 7 3 C9 3 11 4.2 12 6 C13 4.2 15 3 17 3 C19.7 3 22 5 22 8 C22 12 19 15.5 12 21 Z"
      fill={empty ? '#AEB3BB' : '#FF2E4D'}
      stroke="#111111"
      strokeWidth="2.2"
      strokeLinejoin="round"
    />
  </svg>
);

const ChestIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path d="M6 20 C6 11 12 7 24 7 C36 7 42 11 42 20 Z" fill="#C97A2B" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
    <rect x="6" y="20" width="36" height="20" fill="#E09A45" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
    <path d="M6 20 H42" stroke="#111111" strokeWidth="3" />
    <rect x="19.5" y="15.5" width="9" height="11" rx="1.5" fill="#F2CD1C" stroke="#111111" strokeWidth="2.6" />
    <path d="M14 8.5 V40 M34 8.5 V40" stroke="#7A4B12" strokeWidth="3" />
  </svg>
);

const PRIMARY_CTA_CLASS = 'ui-btn ui-btn-green w-full px-4 py-1.5 font-display text-lg tracking-wide';

const ShareButton: React.FC<{ notice: string | null; onShare: () => void; plain?: boolean; label?: string }> = ({
  notice,
  onShare,
  plain = false,
  label,
}) => (
  <div className="space-y-1">
    <button
      type="button"
      data-testid="share-result-btn"
      onClick={onShare}
      className={
        plain
          ? 'inline-flex cursor-pointer items-center gap-1.5 bg-transparent px-2 py-1 text-sm font-bold text-[#4B4B4B] underline underline-offset-2 hover:text-[#111111]'
          : 'ui-btn ui-btn-yellow w-full px-3 py-1 text-sm'
      }
    >
      <UiIcon name="share2" className="w-4 h-4" />
      {label ?? t('Dela resultat')}
    </button>
    <div
      role="status"
      aria-live="polite"
      data-testid="share-notice"
      className="min-h-4 text-center text-[11px] font-bold text-[#0A6FB0]"
    >
      {notice}
    </div>
  </div>
);

const SECONDARY_BTN_CLASS = 'ui-btn w-full px-3 py-1.5 text-sm';

export const GameModals: React.FC<GameModalsProps> = ({
  phase,
  mode,
  levelNumber,
  levelName,
  hasNextLevel,
  snapshotScore,
  bestScore,
  maxCascade,
  movesLeft,
  bonusScore,
  specialBonus,
  stars,
  totalMoves,
  dailyReward,
  chest,
  lostToBomb = false,
  blitzRank,
  challengeScore,
  weeklyEnergy,
  puzzleEnergy,
  leaguePoints = 0,
  winStreak = 0,
  rescueCost = 40,
  rescueEligible = false,
  canRescue = false,
  onRescue,
  livesLeft,
  isFullscreen = false,
  canFullscreen = false,
  onToggleFullscreen,
  onEquipSkin,
  shareNotice,
  onShare,
  onOpenSettings,
  onReplayTutorial,
  onResume,
  onRestart,
  onNextLevel,
  onBackToTitle,
}) => {
  if (phase !== 'PAUSED' && phase !== 'VICTORY' && phase !== 'GAME_OVER') {
    return null;
  }

  const unlockedSkinMeta =
    dailyReward?.unlockedNewSkin ? getSkinMeta(dailyReward.unlockedNewSkin) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111111]/70"
    >
      <div className={`relative w-full max-w-md ${phase === 'VICTORY' ? 'pt-11' : ''}`}>
      {phase === 'VICTORY' && (
        <>
          <Confetti />
          {/* Two animals cheer from behind the panel */}
          <span aria-hidden="true" className="pointer-events-none absolute left-[7%] top-1 h-14 w-14 animate-menu-bob">
            <GemSvg color="ruby" special="none" animationSeed={2} />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-[7%] top-1 h-14 w-14 animate-menu-bob"
            style={{ animationDelay: '-1.3s' }}
          >
            <GemSvg color="cobalt" special="none" animationSeed={9} />
          </span>
        </>
      )}
      {phase === 'VICTORY' && (
        <div className="ui-medal" aria-hidden="true" data-testid="victory-medal">
          <span className="ui-medal-tail ui-medal-tail-left" />
          <span className="ui-medal-tail ui-medal-tail-right" />
          <span className="ui-medal-disc">
            <span className="font-display">{Math.max(0, Math.min(3, Math.round(stars)))}</span>
          </span>
        </div>
      )}
      <div
        className={`ui-panel relative w-full overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-5 ${
          phase === 'VICTORY'
            ? 'max-h-[calc(100dvh-4.75rem)] pt-[5.75rem] sm:pt-[5.75rem] text-center space-y-3.5'
            : 'max-h-[calc(100dvh-2rem)]'
        }`}
      >
        {phase === 'PAUSED' && (
          <>
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                {mode === 'campaign'
                  ? t('Nivå {n} · {name}', { n: levelNumber, name: t(levelName) })
                  : mode === 'daily'
                  ? t(levelName)
                  : mode === 'puzzle'
                  ? t('Dagens pussel')
                  : mode === 'blitz'
                  ? t('Tidsläge')
                  : mode === 'weekly'
                  ? t(levelName)
                  : t('Oändligt läge')}
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-extrabold">
                {t('Spelet pausat')}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <button type="button" onClick={onResume} className={PRIMARY_CTA_CLASS}>
                {t('Fortsätt spela')}
              </button>
              <button type="button" onClick={onRestart} className={SECONDARY_BTN_CLASS}>
                {t('Starta om nivå')}
              </button>
              <button
                type="button"
                data-testid="pause-settings-btn"
                onClick={onOpenSettings}
                className={SECONDARY_BTN_CLASS}
              >
                {t('Inställningar')}
              </button>
              {canFullscreen && onToggleFullscreen && (
                <button
                  type="button"
                  data-testid="pause-fullscreen-btn"
                  onClick={onToggleFullscreen}
                  aria-pressed={isFullscreen}
                  className={SECONDARY_BTN_CLASS}
                >
                  <UiIcon name={isFullscreen ? 'smaller' : 'larger'} className="w-4 h-4" />
                  {isFullscreen ? t('Avsluta hel skärm') : t('Hel skärm')}
                </button>
              )}
              {mode === 'campaign' && onReplayTutorial && (
                <button type="button" onClick={onReplayTutorial} className={SECONDARY_BTN_CLASS}>
                  {t('Visa interaktiv guide')}
                </button>
              )}
              <button
                type="button"
                onClick={onBackToTitle}
                className="w-full py-1.5 px-4 bg-transparent text-sm font-bold text-[#4B4B4B] underline underline-offset-2 hover:text-[#111111] transition-colors cursor-pointer"
              >
                {t('Till huvudmenyn')}
              </button>
            </div>
          </>
        )}

        {phase === 'VICTORY' && (
          <>
            <div className="flex flex-col items-center gap-1.5">
              <StarRating stars={stars} size="lg" animated tone="comic" />
              <div className="mt-1 text-xs font-extrabold uppercase tracking-wider text-[#0B6B2B]">
                {mode === 'daily'
                  ? t('Daglig utmaning avklarad')
                  : mode === 'puzzle'
                  ? t('Dagens pussel avklarat')
                  : t('Nivå {n} avklarad', { n: levelNumber })}
              </div>
              <h2 id="modal-heading" className="font-display text-3xl leading-none tracking-wide">
                {t('{name} löst!', { name: t(levelName) })}
              </h2>
              {nextStarGoal(movesLeft, totalMoves) && (
                <div className="text-[11px] font-semibold text-[#4B4B4B]" data-testid="next-star-goal">
                  {nextStarGoal(movesLeft, totalMoves)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="ui-inset px-1 py-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Poäng')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#111111] mt-0.5">
                  <CountUp value={snapshotScore} />
                </div>
              </div>
              <div className="ui-inset px-1 py-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Drag kvar')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#111111] mt-0.5">
                  {Math.round(movesLeft)}
                </div>
              </div>
              <div className="ui-inset px-1 py-2">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Max kedja')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#111111] mt-0.5">
                  ×{Math.round(maxCascade)}
                </div>
              </div>
            </div>

            <div
              data-testid="victory-finale"
              title={`${t('Drag kvar: {n} × 120', { n: movesLeft })} · ${t('Sparade specialdjur: +{n}', {
                n: formatNumber(specialBonus),
              })}`}
              className="flex items-center justify-between gap-2 border-[3px] border-[#111111] bg-[var(--ui-yellow)] px-2.5 py-1.5 text-left"
            >
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                {t('Skördefest')}
              </span>
              <span className="font-mono-num text-sm font-bold text-[#111111]">
                {t('+{n} p', { n: formatNumber(bonusScore) })}
              </span>
            </div>

            {chest && (
              <div
                data-testid="chapter-chest"
                className="flex items-center gap-2.5 border-[3px] border-[#111111] bg-[var(--ui-blue)] px-2.5 py-2 text-left"
              >
                <ChestIcon className="h-10 w-10 shrink-0 animate-star-pop" />
                <div className="min-w-0 text-sm font-semibold leading-snug">
                  <div className="text-xs font-extrabold uppercase tracking-wider">
                    {t('Kapitelkista öppnad')}
                  </div>
                  <div>
                    {chest.skin
                      ? t('+{n} bonusenergi och nytt djur-skin: {name}', {
                          n: chest.energy,
                          name: t(getSkinMeta(chest.skin).nameSv),
                        })
                      : t('+{n} bonusenergi till nästa omgång', { n: chest.energy })}
                  </div>
                </div>
              </div>
            )}

            {mode === 'weekly' && weeklyEnergy !== undefined && (
              <div data-testid="weekly-reward" className="ui-inset px-3 py-2 text-sm font-extrabold">
                {weeklyEnergy > 0
                  ? t('Veckans specialnivå klarad! +{n} bonusenergi', { n: weeklyEnergy })
                  : t('Klarad igen – veckans pris är redan hämtat')}
              </div>
            )}

            {mode === 'puzzle' && puzzleEnergy !== undefined && (
              <div data-testid="puzzle-reward" className="ui-inset px-3 py-2 text-sm font-extrabold">
                {puzzleEnergy > 0
                  ? t('Pusslet löst! +{n} bonusenergi', { n: puzzleEnergy })
                  : t('Löst igen – dagens pusselpris är redan hämtat')}
              </div>
            )}

            {(leaguePoints > 0 || (mode === 'campaign' && winStreak > 0)) && (
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-extrabold">
                {leaguePoints > 0 && (
                  <span className="rounded-full border-2 border-[#111111] bg-[#27B8FF] px-2.5 py-0.5 text-[#111111]">
                    {t('+{n} ligapoäng', { n: leaguePoints })}
                  </span>
                )}
                {mode === 'campaign' && winStreak > 0 && (
                  <span className="rounded-full border-2 border-[#111111] bg-[#F2CD1C] px-2.5 py-0.5 text-[#111111]">
                    {t('Vinstsvit: {n} i rad', { n: winStreak })}
                  </span>
                )}
              </div>
            )}

            {/* Daily Challenge Reward Box */}
            {mode === 'daily' && dailyReward && (
              <div
                data-testid="daily-reward-summary"
                className="ui-inset p-3 space-y-2.5 text-left"
              >
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4002A]">
                  {dailyReward.alreadyClaimed
                    ? t('Dagens belöning redan hämtad')
                    : t('Belöning upplåst')}
                </div>

                {!dailyReward.alreadyClaimed && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1 text-sm font-semibold text-[#111111]">
                      <div>
                        <span className="font-mono-num font-bold text-[#D4002A]">
                          +{dailyReward.energyGranted}
                        </span>{' '}
                        {t('Bonusenergi till nästa omgång')}
                      </div>
                      {dailyReward.streak ? (
                        <div data-testid="daily-streak-result">
                          {t('Svit: {n} dagar i rad', { n: dailyReward.streak })}
                          {dailyReward.streakEnergy ? (
                            <span className="font-mono-num font-bold text-[#D4002A]">
                              {' '}
                              +{dailyReward.streakEnergy}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      {unlockedSkinMeta && (
                        <div>
                          {t('Nytt djur-skin:')}{' '}
                          <span className="font-extrabold text-[#111111]">
                            {t(unlockedSkinMeta.nameSv)}
                          </span>
                        </div>
                      )}
                    </div>
                    {dailyReward.unlockedNewSkin && (
                      <div className="w-12 h-12 shrink-0">
                        <GemSvg
                          color="ruby"
                          special="none"
                          skin={dailyReward.unlockedNewSkin}
                          className="w-full h-full"
                        />
                      </div>
                    )}
                  </div>
                )}

                {dailyReward.unlockedNewSkin && unlockedSkinMeta && (
                  <button
                    type="button"
                    onClick={() => onEquipSkin(dailyReward.unlockedNewSkin!)}
                    className="ui-btn ui-btn-wood w-full px-2 py-0.5 text-sm"
                  >
                    {t('Aktivera {name} direkt', { name: t(unlockedSkinMeta.nameSv) })}
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {hasNextLevel ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={onNextLevel}
                  className={PRIMARY_CTA_CLASS}
                >
                  {t('Nästa nivå')}
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className={PRIMARY_CTA_CLASS}
                >
                  {t('Spela igen')}
                </button>
              )}
              <div className={`grid gap-2.5 ${hasNextLevel ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {hasNextLevel && (
                  <button type="button" onClick={onRestart} className={SECONDARY_BTN_CLASS}>
                    {t('Spela igen')}
                  </button>
                )}
                <button type="button" onClick={onBackToTitle} className={SECONDARY_BTN_CLASS}>
                  {t('Till huvudmenyn')}
                </button>
              </div>
            </div>

            <ShareButton notice={shareNotice} onShare={onShare} plain />
          </>
        )}

        {phase === 'GAME_OVER' && (
          <>
            <div className="space-y-1">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#D4002A]">
                {mode === 'blitz' ? t('Tiden är ute') : lostToBomb ? t('Bomben smällde') : t('Slut på drag')}
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-extrabold">
                {mode === 'campaign' || mode === 'daily' || mode === 'weekly' || mode === 'puzzle'
                  ? t('{name} — Försök igen', { name: t(levelName) })
                  : t('Omgången avslutad')}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="ui-inset p-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Poäng')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#111111] mt-0.5">
                  {formatNumber(snapshotScore)}
                </div>
              </div>
              <div className="ui-inset p-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Bästa')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#D4002A] mt-0.5">
                  {formatNumber(bestScore)}
                </div>
              </div>
              <div className="ui-inset p-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Max kedja')}
                </div>
                <div className="font-mono-num text-lg font-bold text-[#111111] mt-0.5">
                  ×{Math.round(maxCascade)}
                </div>
              </div>
            </div>

            {mode === 'blitz' && blitzRank !== undefined && (
              <div data-testid="blitz-rank" className="ui-inset px-3 py-2 text-sm font-extrabold">
                {blitzRank === 1
                  ? t('Veckans bästa omgång!')
                  : blitzRank > 1
                  ? t('Plats {n} på veckans lista', { n: blitzRank })
                  : t('Utanför veckans topp fem – försök igen!')}
              </div>
            )}

            {mode === 'blitz' && challengeScore !== undefined && (
              <div data-testid="challenge-result" className="ui-inset px-3 py-2 text-sm font-extrabold">
                {snapshotScore > challengeScore
                  ? t('Du slog utmaningen på {n} poäng!', { n: formatNumber(challengeScore) })
                  : t('Utmaningen på {n} poäng står kvar – försök igen!', { n: formatNumber(challengeScore) })}
              </div>
            )}

            {mode === 'blitz' && (
              <ShareButton notice={shareNotice} onShare={onShare} label={t('Utmana en vän')} />
            )}

            {mode === 'endless' && <ShareButton notice={shareNotice} onShare={onShare} />}

            {mode === 'campaign' && livesLeft !== undefined && (
              <div data-testid="lives-left" className="ui-inset flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-bold">
                <HeartIcon className="h-5 w-5" />
                {livesLeft > 0
                  ? t('Du förlorade ett liv · {n} kvar', { n: livesLeft })
                  : t('Liven är slut – nya fylls på i huvudmenyn')}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {rescueEligible && onRescue && (
                <div className="space-y-1">
                  <button
                    type="button"
                    data-testid="rescue-btn"
                    onClick={onRescue}
                    disabled={!canRescue}
                    className="ui-btn ui-btn-yellow w-full px-4 py-2 font-display text-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('Rädda omgången (+5 drag · {cost} energi)', { cost: rescueCost })}
                  </button>
                  {mode === 'campaign' && winStreak > 0 && canRescue && (
                    <div className="text-center text-[11px] font-bold text-[#0B6B2B]">
                      {t('Behåller din vinstsvit ({n}) och sparar ditt liv!', { n: winStreak })}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                disabled={mode === 'campaign' && livesLeft === 0}
                className={`${PRIMARY_CTA_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {t('Spela igen')}
              </button>
              <button type="button" onClick={onBackToTitle} className={SECONDARY_BTN_CLASS}>
                {t('Till huvudmenyn')}
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
};
