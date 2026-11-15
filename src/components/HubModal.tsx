import React, { useEffect } from 'react';
import { formatNumber, t } from '../i18n';
import { AchievementStats } from '../game/achievements';
import {
  COMPANIONS,
  MAX_LEVEL,
  UNLOCK_AT,
  animalLevel,
  chargeNeeded,
  isCompanionUnlocked,
} from '../game/companions';
import { BUILDINGS, BUILD_GIFT, IslandState, nextBuilding, starsAvailable } from '../game/island';
import { ALL_DONE_BONUS, Mission, MissionState, missionsDone } from '../game/missions';
import { RewardState } from '../game/rewards';
import { BlitzState, PlayStats, formatPlayTime } from '../game/stats';
import { STORY_PAGES } from '../game/story';
import { AnimalSkinId, GEM_COLORS_ORDER, GEM_META, GemColor } from '../game/types';
import { GemSvg } from './GemSvg';
import { IslandScene } from './IslandScene';
import { UiIcon } from './UiIcon';

export type HubTab = 'missions' | 'companion' | 'island' | 'stats';

export const HUB_TABS: Array<{ id: HubTab; label: string }> = [
  { id: 'missions', label: 'Uppdrag' },
  { id: 'companion', label: 'Kompis' },
  { id: 'island', label: 'Din ö' },
  { id: 'stats', label: 'Statistik' },
];

interface HubModalProps {
  tab: HubTab | null;
  onTab: (tab: HubTab) => void;
  onClose: () => void;
  skin: AnimalSkinId;
  missions: Mission[];
  missionState: MissionState;
  rewardState: RewardState;
  companion: GemColor;
  onSelectCompanion: (color: GemColor) => void;
  island: IslandState;
  stars: number;
  onBuild: () => void;
  stats: PlayStats;
  achievementStats: AchievementStats;
  blitz: BlitzState;
  bestEndlessScore: number;
  levelsCleared: number;
  seenPages: string[];
  onReadStory: (id: string) => void;
}

function missionLabel(mission: Mission): string {
  const n = formatNumber(mission.target);
  switch (mission.kind) {
    case 'animals':
      return t('Samla {n} djur', { n });
    case 'color':
      return t('Samla {n} st: {animal}', { n, animal: t(GEM_META[mission.color ?? 'ruby'].nameSv) });
    case 'specials':
      return t('Skapa {n} specialbrickor', { n });
    case 'cascades':
      return t('Gör {n} kedjor på minst ×3', { n });
    case 'score':
      return t('Tjäna {n} poäng', { n });
    case 'wins':
      return t('Vinn {n} nivåer', { n });
    case 'powers':
      return t('Använd din kompis kraft {n} gånger', { n });
    case 'blockers':
      return t('Rensa {n} hinder', { n });
  }
}

const Bar: React.FC<{ share: number; color?: string }> = ({ share, color = '#39D353' }) => (
  <span className="block h-2.5 w-full border-2 border-[#111111] bg-[#FFFFFF]/70">
    <span
      className="block h-full origin-left"
      style={{ background: color, transform: `scaleX(${Math.max(0, Math.min(1, share))})` }}
    />
  </span>
);

const Heading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">{children}</h3>
);

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="ui-inset px-2.5 py-1.5">
    <div className="truncate text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">{label}</div>
    <div className="font-mono-num text-base font-bold leading-tight">{value}</div>
  </div>
);

/** Missions, the companion, the island and the statistics, one tab each. */
export const HubModal: React.FC<HubModalProps> = ({
  tab,
  onTab,
  onClose,
  skin,
  missions,
  missionState,
  rewardState,
  companion,
  onSelectCompanion,
  island,
  stars,
  onBuild,
  stats,
  achievementStats,
  blitz,
  bestEndlessScore,
  levelsCleared,
  seenPages,
  onReadStory,
}) => {
  useEffect(() => {
    if (!tab) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, onClose]);

  if (!tab) return null;

  const done = missionsDone(missionState, missions);
  const next = nextBuilding(island);
  const free = starsAvailable(island, stars);
  const totalAnimals = GEM_COLORS_ORDER.reduce((sum, color) => sum + rewardState.album[color], 0);
  let favourite: GemColor = GEM_COLORS_ORDER[0];
  for (const color of GEM_COLORS_ORDER) {
    if (rewardState.album[color] > rewardState.album[favourite]) favourite = color;
  }
  const time = formatPlayTime(stats.secondsPlayed);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hub-modal-title"
      data-testid="hub-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/70"
    >
      <div className="ui-panel w-full max-w-2xl max-h-[calc(100dvh-1.5rem)] flex flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3 pb-2">
          <h2 id="hub-modal-title" className="font-display text-xl">
            {t(HUB_TABS.find((entry) => entry.id === tab)?.label ?? '')}
          </h2>
          <button
            type="button"
            data-testid="close-hub-btn"
            onClick={onClose}
            className="ui-btn ui-btn-red shrink-0 px-2 py-1 text-xs sm:text-sm"
          >
            {t('Stäng')}
          </button>
        </div>

        <div role="tablist" className="flex gap-1.5 border-b-2 border-[#111111] pb-2">
          {HUB_TABS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={tab === entry.id}
              data-testid={`hub-tab-${entry.id}`}
              onClick={() => onTab(entry.id)}
              className={`ui-btn flex-1 px-1 text-[11px] sm:text-[13px] ${
                tab === entry.id ? 'ui-btn-wood py-0.5' : 'py-1.5'
              }`}
            >
              {t(entry.label)}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto overscroll-contain pt-3">
          {tab === 'missions' && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold text-[#4B4B4B]">
                {t('Tre nya uppdrag varje dag. De fylls på i alla spellägen och betalar bonusenergi direkt. Alla tre ger {n} extra.', {
                  n: ALL_DONE_BONUS,
                })}
              </p>
              {missions.map((mission, i) => {
                const now = Math.min(mission.target, missionState.progress[i] ?? 0);
                const finished = now >= mission.target;
                return (
                  <div
                    key={mission.kind}
                    data-testid="mission"
                    data-done={finished}
                    className={`ui-inset px-3 py-2 ${finished ? '!bg-[#CFF5D2]' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-sm font-extrabold">{missionLabel(mission)}</span>
                      <span className="shrink-0 border-2 border-[#111111] bg-[#F2CD1C] px-1.5 text-[11px] font-extrabold">
                        +{mission.reward}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Bar share={now / mission.target} />
                      <span className="shrink-0 font-mono-num text-[11px] font-bold">
                        {finished ? t('Klart') : `${formatNumber(now)}/${formatNumber(mission.target)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div className="text-center text-xs font-extrabold uppercase tracking-wider">
                {t('{n} av 3 klara i dag', { n: done })}
              </div>
            </section>
          )}

          {tab === 'companion' && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold text-[#4B4B4B]">
                {t('Välj ett djur som följer med. Kraften laddas av djuren du rensar, tre gånger snabbare av kompisens egen sort, och kostar inget drag. Ju fler du samlat av ett djur, desto högre nivå och snabbare laddning.')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPANIONS.map((def, i) => {
                  const collected = rewardState.album[def.color];
                  const unlocked = isCompanionUnlocked(def.color, rewardState.album);
                  const lvl = animalLevel(collected);
                  const active = companion === def.color;
                  return (
                    <button
                      key={def.color}
                      type="button"
                      data-testid={`companion-${def.color}`}
                      aria-pressed={active}
                      disabled={!unlocked}
                      onClick={() => onSelectCompanion(def.color)}
                      className={`ui-inset flex items-center gap-2.5 px-2.5 py-2 text-left disabled:cursor-not-allowed ${
                        active ? '!bg-[#27B8FF]' : ''
                      }`}
                    >
                      <span className={`h-12 w-12 shrink-0 ${unlocked ? '' : 'opacity-40 grayscale'}`}>
                        <GemSvg color={def.color} special="none" skin={skin} animationSeed={i * 11 + 2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-extrabold">
                            {t(GEM_META[def.color].nameSv)} · {t(def.powerSv)}
                          </span>
                          <span className="shrink-0 border-2 border-[#111111] bg-[#F2CD1C] px-1 text-[10px] font-extrabold">
                            {unlocked ? t('Nivå {n}', { n: lvl.level }) : <UiIcon name="locked" className="h-3 w-3" />}
                          </span>
                        </span>
                        <span className="block text-[11px] font-semibold leading-snug text-[#333333]">
                          {t(def.descSv)}
                        </span>
                        {unlocked ? (
                          <span className="mt-1 flex items-center gap-1.5">
                            <Bar share={lvl.next ? (collected - lvl.from) / (lvl.next - lvl.from) : 1} color="#FF2E4D" />
                            <span className="shrink-0 font-mono-num text-[10px] font-bold">
                              {lvl.next
                                ? `${formatNumber(collected)}/${formatNumber(lvl.next)}`
                                : t('Max nivå {n}', { n: MAX_LEVEL })}
                            </span>
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[10px] font-extrabold uppercase tracking-wider text-[#D4002A]">
                            {t('Samla {n} för att låsa upp ({now}/{n})', { n: UNLOCK_AT, now: Math.min(UNLOCK_AT, collected) })}
                          </span>
                        )}
                        {unlocked && (
                          <span className="block text-[10px] font-semibold text-[#4B4B4B]">
                            {t('Laddas av {n} djur', { n: chargeNeeded(lvl.level) })}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {tab === 'island' && (
            <section className="space-y-2.5">
              <p className="text-xs font-semibold text-[#4B4B4B]">
                {t('Bygg upp djurens ö med stjärnorna du vinner i kampanjen. Varje bygge ger {n} bonusenergi.', {
                  n: BUILD_GIFT,
                })}
              </p>
              <IslandScene built={island.built} className="w-full border-[3px] border-[#111111]" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-extrabold">
                  <UiIcon name="star" className="h-4 w-4 text-[#E09A00]" />
                  <span data-testid="island-stars">{t('{n} stjärnor att bygga för', { n: formatNumber(free) })}</span>
                </span>
                {next ? (
                  <button
                    type="button"
                    data-testid="build-btn"
                    onClick={onBuild}
                    disabled={free < next.cost}
                    className="ui-btn ui-btn-green px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('Bygg {name} · {n} stjärnor', { name: t(next.nameSv), n: next.cost })}
                  </button>
                ) : (
                  <span className="text-sm font-extrabold text-[#1E7D32]">{t('Ön är färdigbyggd!')}</span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {BUILDINGS.map((building, i) => (
                  <div
                    key={building.id}
                    className={`ui-inset px-2 py-1 text-center text-[11px] font-extrabold ${
                      i < island.built ? '!bg-[#CFF5D2]' : i === island.built ? '' : 'opacity-55'
                    }`}
                  >
                    <div className="truncate">{t(building.nameSv)}</div>
                    <div className="font-mono-num text-[10px] font-bold text-[#4B4B4B]">
                      {i < island.built ? t('Byggd') : `${building.cost} ★`}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tab === 'stats' && (
            <section className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Stat
                  label={t('Spelad tid')}
                  value={t('{h} h {m} min', { h: time.hours, m: time.minutes })}
                />
                <Stat label={t('Spelade omgångar')} value={formatNumber(stats.gamesPlayed)} />
                <Stat label={t('Vunna omgångar')} value={formatNumber(stats.gamesWon)} />
                <Stat label={t('Klarade nivåer')} value={formatNumber(levelsCleared)} />
                <Stat label={t('Stjärnor')} value={formatNumber(stars)} />
                <Stat label={t('Besegrade bossar')} value={formatNumber(stats.bossesBeaten)} />
                <Stat label={t('Samlade djur')} value={formatNumber(totalAnimals)} />
                <Stat label={t('Favoritdjur')} value={t(GEM_META[favourite].nameSv)} />
                <Stat label={t('Längsta kedja')} value={`×${achievementStats.bestCascade}`} />
                <Stat label={t('Gjorda drag')} value={formatNumber(stats.moves)} />
                <Stat label={t('Använda krafter')} value={formatNumber(stats.powersUsed)} />
                <Stat label={t('Klarade uppdrag')} value={formatNumber(stats.missionsDone)} />
                <Stat label={t('Skapade specialbrickor')} value={formatNumber(achievementStats.totalSpecialsCreated)} />
                <Stat label={t('Rekord i oändligt')} value={formatNumber(bestEndlessScore)} />
                <Stat label={t('Rekord i tidsläget')} value={formatNumber(blitz.best)} />
              </div>

              <div>
                <Heading>{t('Berättelsen')}</Heading>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {STORY_PAGES.map((page) => {
                    const seen = seenPages.includes(page.id);
                    return (
                      <button
                        key={page.id}
                        type="button"
                        data-testid={`story-page-${page.id}`}
                        disabled={!seen}
                        onClick={() => onReadStory(page.id)}
                        className="ui-btn px-1.5 py-1 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {!seen && <UiIcon name="locked" className="h-3 w-3" />}
                        <span className="truncate">{t(page.titleSv)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
