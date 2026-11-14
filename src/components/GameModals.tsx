import React from 'react';
import { AnimalSkinId, GameMode, GamePhase } from '../game/types';
import { getSkinMeta } from '../game/daily';
import { nextStarGoal } from '../game/mastery';
import { GemSvg } from './GemSvg';
import { StarRating } from './StarRating';

export interface DailyRewardResult {
  energyGranted: number;
  unlockedNewSkin: AnimalSkinId | null;
  alreadyClaimed: boolean;
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
  onEquipSkin: (skin: AnimalSkinId) => void;
  onReplayTutorial?: () => void;
  onResume: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  onBackToTitle: () => void;
}

const PRIMARY_CTA_CLASS =
  'w-full py-3.5 px-4 bg-gradient-to-b from-[#059669] to-[#047857] hover:from-[#10B981] hover:to-[#059669] active:translate-y-0.5 text-white font-display font-bold text-base tracking-wide rounded-xl border border-[#34D399]/60 border-b-4 border-b-[#064E3B] shadow-[0_8px_20px_rgba(5,150,105,0.4)] transition-all cursor-pointer [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]';

const SECONDARY_BTN_CLASS =
  'w-full py-2.5 px-4 bg-[#1E2638] hover:bg-[#29344D] active:translate-y-0.5 text-white font-semibold rounded-xl border border-white/15 border-b-[3px] border-b-[#0A0E17] transition-all cursor-pointer';

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
  onEquipSkin,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090C13]/84"
    >
      <div className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain bg-gradient-to-b from-[#1B2232] to-[#131824] border border-white/20 border-b-[6px] border-b-[#070A10] rounded-2xl p-6 sm:p-7 shadow-[0_24px_60px_rgba(0,0,0,0.8)] space-y-6">
        {phase === 'PAUSED' && (
          <>
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#CBD5E1]">
                {mode === 'campaign'
                  ? `Nivå ${levelNumber} · ${levelName}`
                  : mode === 'daily'
                  ? levelName
                  : 'Oändligt läge'}
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-bold text-white">
                Spelet pausat
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <button type="button" onClick={onResume} className={PRIMARY_CTA_CLASS}>
                Fortsätt spela
              </button>
              <button type="button" onClick={onRestart} className={SECONDARY_BTN_CLASS}>
                Starta om nivå
              </button>
              {mode === 'campaign' && onReplayTutorial && (
                <button type="button" onClick={onReplayTutorial} className={SECONDARY_BTN_CLASS}>
                  Visa interaktiv guide
                </button>
              )}
              <button
                type="button"
                onClick={onBackToTitle}
                className="w-full py-2.5 px-4 bg-transparent hover:bg-white/10 text-[#E2E8F0] font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Till huvudmenyn
              </button>
            </div>
          </>
        )}

        {phase === 'VICTORY' && (
          <>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#34D399]">
                {mode === 'daily' ? 'Daglig utmaning avklarad' : `Nivå ${levelNumber} avklarad`}
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-bold text-white">
                {levelName} löst!
              </h2>
            </div>

            <div className="flex flex-col items-center gap-1.5 -mt-2">
              <StarRating stars={stars} size="lg" animated />
              <div className="text-xs font-bold uppercase tracking-wider text-[#FDE047]">
                {stars} av 3 stjärnor
              </div>
              {nextStarGoal(movesLeft, totalMoves) && (
                <div className="text-[11px] font-medium text-[#CBD5E1]" data-testid="next-star-goal">
                  {nextStarGoal(movesLeft, totalMoves)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Poäng
                </div>
                <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                  {Math.round(snapshotScore).toLocaleString('sv-SE')}
                </div>
              </div>
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Drag kvar
                </div>
                <div className="font-mono-num text-lg font-bold text-[#FDE047] mt-0.5">
                  {Math.round(movesLeft)}
                </div>
              </div>
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Max kedja
                </div>
                <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                  ×{Math.round(maxCascade)}
                </div>
              </div>
            </div>

            <div
              data-testid="victory-finale"
              className="rounded-xl border border-[#F5B841]/45 bg-gradient-to-b from-[#2C2416] to-[#171208] p-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-[#FDE047]">
                  Skördefest
                </div>
                <div className="font-mono-num text-sm font-bold text-[#FDE047]">
                  +{Math.round(bonusScore).toLocaleString('sv-SE')} p
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-semibold text-[#CBD5E1]">
                <span>Drag kvar: {movesLeft} × 120</span>
                <span>Sparade specialdjur: +{Math.round(specialBonus).toLocaleString('sv-SE')}</span>
              </div>
              <div className="mt-1 text-xs font-medium text-[#F1F5F9]">
                {movesLeft > 0
                  ? 'Dina kvarvarande drag och specialdjur är redan inräknade i poängen.'
                  : 'Du klarade målet på sista draget. Dina sparade specialdjur är inräknade.'}
              </div>
            </div>

            {/* Daily Challenge Reward Box */}
            {mode === 'daily' && dailyReward && (
              <div
                data-testid="daily-reward-summary"
                className="bg-[#1C2436] border border-[#F5B841]/45 rounded-xl p-4 space-y-3"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-[#FDE047]">
                  {dailyReward.alreadyClaimed
                    ? 'Dagens belöning redan hämtad'
                    : 'Belöning upplåst'}
                </div>

                {!dailyReward.alreadyClaimed && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1 text-sm text-[#F1F5F9]">
                      <div>
                        <span className="font-mono-num font-bold text-[#FDE047]">
                          +{dailyReward.energyGranted}
                        </span>{' '}
                        Bonusenergi till nästa omgång
                      </div>
                      {unlockedSkinMeta && (
                        <div>
                          Nytt djur-skin:{' '}
                          <span className="font-semibold text-white">
                            {unlockedSkinMeta.nameSv}
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
                    className="w-full py-2.5 px-3 bg-[#263147] hover:bg-[#31405C] text-white text-sm font-semibold rounded-lg border border-[#F5B841]/55 transition-colors cursor-pointer"
                  >
                    Aktivera {unlockedSkinMeta.nameSv} direkt
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
                  Nästa nivå
                </button>
              ) : (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className={PRIMARY_CTA_CLASS}
                >
                  Spela igen
                </button>
              )}
              <div className={`grid gap-2.5 ${hasNextLevel ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {hasNextLevel && (
                  <button type="button" onClick={onRestart} className={SECONDARY_BTN_CLASS}>
                    Spela igen
                  </button>
                )}
                <button type="button" onClick={onBackToTitle} className={SECONDARY_BTN_CLASS}>
                  Till huvudmenyn
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'GAME_OVER' && (
          <>
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FCA5A5]">
                Slut på drag
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-bold text-white">
                {mode === 'campaign' || mode === 'daily'
                  ? `${levelName} — Försök igen`
                  : 'Omgången avslutad'}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Poäng
                </div>
                <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                  {Math.round(snapshotScore).toLocaleString('sv-SE')}
                </div>
              </div>
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Bästa
                </div>
                <div className="font-mono-num text-lg font-bold text-[#FDE047] mt-0.5">
                  {Math.round(bestScore).toLocaleString('sv-SE')}
                </div>
              </div>
              <div className="bg-[#1C2436] rounded-xl p-3 border border-white/10 border-b-[3px] border-b-[#0B0F19]">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#CBD5E1]">
                  Max kedja
                </div>
                <div className="font-mono-num text-lg font-bold text-white mt-0.5">
                  ×{Math.round(maxCascade)}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className={PRIMARY_CTA_CLASS}
              >
                Spela igen
              </button>
              <button type="button" onClick={onBackToTitle} className={SECONDARY_BTN_CLASS}>
                Till huvudmenyn
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
