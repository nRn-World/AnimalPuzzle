import React from 'react';
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

const PRIMARY_CTA_CLASS = 'ui-btn ui-btn-green w-full px-4 py-1.5 font-display text-lg tracking-wide';

const ShareButton: React.FC<{ notice: string | null; onShare: () => void; plain?: boolean }> = ({
  notice,
  onShare,
  plain = false,
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
      {t('Dela resultat')}
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
        <div className="ui-medal" aria-hidden="true" data-testid="victory-medal">
          <span className="ui-medal-tail ui-medal-tail-left" />
          <span className="ui-medal-tail ui-medal-tail-right" />
          <span className="ui-medal-disc">
            <span className="font-display">{Math.max(0, Math.min(3, Math.round(stars)))}</span>
          </span>
        </div>
      )}
      <div
        className={`ui-panel w-full overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-5 ${
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
                  {formatNumber(snapshotScore)}
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
                {t('Slut på drag')}
              </div>
              <h2 id="modal-heading" className="font-display text-2xl font-extrabold">
                {mode === 'campaign' || mode === 'daily'
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

            {mode === 'endless' && <ShareButton notice={shareNotice} onShare={onShare} />}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className={PRIMARY_CTA_CLASS}
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
