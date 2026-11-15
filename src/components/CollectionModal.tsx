import React, { useEffect } from 'react';
import { formatNumber, t } from '../i18n';
import { ALBUM_TIERS, RewardState, albumTier } from '../game/rewards';
import { GEM_COLORS_ORDER, GEM_META } from '../game/types';
import { GemSvg } from './GemSvg';
import { UiIcon } from './UiIcon';

interface CollectionModalProps {
  open: boolean;
  rewardState: RewardState;
  onClose: () => void;
}

const TIER_STYLE = [
  'bg-[#B4B9C1] text-[#4B4B4B]',
  'bg-[#D99A5B] text-[#111111]',
  'bg-[#DDE1E7] text-[#111111]',
  'bg-[#F2CD1C] text-[#111111]',
  'bg-[#27B8FF] text-[#111111]',
];

const MODE_LABELS = {
  campaign: { text: 'Kampanj' },
  daily: { text: 'Daglig' },
  endless: { text: 'Oändligt' },
  blitz: { text: 'Tidsläge' },
  weekly: { text: 'Veckans nivå' },
};

/** The animal album (a card per animal that levels up) and the top list. */
export const CollectionModal: React.FC<CollectionModalProps> = ({ open, rewardState, onClose }) => {
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

  const total = GEM_COLORS_ORDER.reduce((sum, color) => sum + rewardState.album[color], 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collection-modal-title"
      data-testid="collection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/70"
    >
      <div className="ui-panel w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] flex flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-4 pb-2 border-b-2 border-[#111111]">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4002A]">
              {t('{n} djur samlade', { n: formatNumber(total) })}
            </div>
            <h2 id="collection-modal-title" className="font-display text-xl">
              {t('Album och topplista')}
            </h2>
          </div>
          <button
            type="button"
            data-testid="close-collection-btn"
            onClick={onClose}
            className="ui-btn ui-btn-red shrink-0 px-2 py-1 text-xs sm:text-sm"
          >
            {t('Stäng')}
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain pt-3 space-y-4">
          <section>
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">
              {t('Djuralbum')}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-[#4B4B4B]">
              {t('Varje djur du samlar i en bana räknas. Korten stiger i rang: {tiers}.', {
                tiers: ALBUM_TIERS.map((tier) => `${t(tier.nameSv)} ${formatNumber(tier.at)}`).join(' · '),
              })}
            </p>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {GEM_COLORS_ORDER.map((color, i) => {
                const collected = rewardState.album[color];
                const { tier, next, from } = albumTier(collected);
                const share = next ? Math.min(1, (collected - from) / (next - from)) : 1;
                return (
                  <div
                    key={color}
                    data-testid={`album-card-${color}`}
                    className="ui-inset relative flex flex-col items-center px-1.5 pt-2 pb-1.5 text-center"
                  >
                    <span
                      className={`absolute -top-1.5 -right-1.5 border-2 border-[#111111] px-1 text-[9px] font-extrabold uppercase ${TIER_STYLE[tier]}`}
                    >
                      {tier === 0 ? t('Ny') : t(ALBUM_TIERS[tier - 1].nameSv)}
                    </span>
                    <span className={`h-11 w-11 ${collected === 0 ? 'opacity-40 grayscale' : ''}`}>
                      <GemSvg color={color} special="none" animationSeed={i * 13 + 5} />
                    </span>
                    <span className="mt-0.5 w-full truncate text-xs font-extrabold">
                      {t(GEM_META[color].nameSv)}
                    </span>
                    <span className="font-mono-num text-[11px] font-bold text-[#4B4B4B]">
                      {next
                        ? `${formatNumber(collected)}/${formatNumber(next)}`
                        : formatNumber(collected)}
                    </span>
                    <span className="mt-1 block h-2 w-full border-2 border-[#111111] bg-[#FFFFFF]/50">
                      <span
                        className="block h-full bg-[#6FE65E]"
                        style={{ width: `${Math.round(share * 100)}%` }}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">
              {t('Topplista')}
            </h3>
            <p className="mt-0.5 text-[11px] font-semibold text-[#4B4B4B]">
              {t('Dina tio bästa resultat på den här enheten.')}
            </p>
            {rewardState.topScores.length === 0 ? (
              <p className="ui-inset mt-2 px-3 py-2 text-sm font-semibold">
                {t('Inga resultat än – spela en bana så hamnar den här.')}
              </p>
            ) : (
              <ol data-testid="top-list" className="mt-2 space-y-1">
                {rewardState.topScores.map((entry, i) => (
                  <li
                    key={`${entry.dateKey}-${entry.score}-${i}`}
                    className="ui-inset flex items-center gap-2 px-2 py-1 text-sm"
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-[#111111] font-mono-num text-xs font-extrabold ${
                        i === 0 ? 'bg-[#F2CD1C]' : 'bg-[#DDE1E7]'
                      }`}
                    >
                      {i + 1}
                    </span>
                    {i === 0 && <UiIcon name="trophy" className="h-4 w-4 shrink-0 text-[#D4002A]" />}
                    <span className="min-w-0 flex-1 truncate font-bold">
                      {entry.mode === 'campaign'
                        ? t('Nivå {n}', { n: formatNumber(entry.level) })
                        : t(MODE_LABELS[entry.mode].text)}
                      <span className="ml-1.5 font-mono-num text-[10px] font-semibold text-[#4B4B4B]">
                        {entry.dateKey}
                      </span>
                    </span>
                    <span className="font-mono-num font-extrabold">{formatNumber(entry.score)}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
