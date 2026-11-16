import { PASS_REWARDS, PASS_STEP, PassState, passReached } from '../game/seasonPass';
import { CALENDAR_REWARDS, CalendarState, calendarShown, canClaimCalendar } from '../game/calendar';
import React, { useEffect } from 'react';
import { formatNumber, t } from '../i18n';
import { AchievementStats } from '../game/achievements';
import {
  COMPANIONS,
  MAX_LEVEL,
  TIER_EXTRA_CELLS,
  UNLOCK_AT,
  powerTier,
  animalLevel,
  chargeNeeded,
  isCompanionUnlocked,
} from '../game/companions';
import {
  BUILDINGS,
  BUILD_GIFT,
  DAILY_GIFT_PER_BUILDING,
  IslandState,
  canCollectGift,
  dailyGift,
  nextBuilding,
  nextUpgrade,
  upgradedCount,
  starsAvailable,
} from '../game/island';
import { ALL_DONE_BONUS, Mission, MissionState, missionsDone } from '../game/missions';
import {
  getLeagueTier,
  LEAGUE_TIERS,
  LeagueStandingRow,
  LeagueState,
} from '../game/league';
import { RewardState } from '../game/rewards';
import { BlitzState, PlayStats, formatPlayTime } from '../game/stats';
import { STORY_PAGES } from '../game/story';
import { AnimalSkinId, GEM_COLORS_ORDER, GEM_META, GemColor } from '../game/types';
import { GemSvg } from './GemSvg';
import { IslandScene } from './IslandScene';
import { UiIcon } from './UiIcon';

export type HubTab = 'missions' | 'league' | 'companion' | 'island' | 'stats';

export const HUB_TABS: Array<{ id: HubTab; label: string }> = [
  { id: 'missions', label: 'Uppdrag' },
  { id: 'league', label: 'Liga' },
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
  onCollectGift: () => void;
  onUpgrade: () => void;
  calendar: CalendarState;
  onClaimCalendar: () => void;
  pass: PassState;
  onClaimPass: () => void;
  todayKey: string;
  stats: PlayStats;
  achievementStats: AchievementStats;
  blitz: BlitzState;
  bestEndlessScore: number;
  levelsCleared: number;
  seenPages: string[];
  onReadStory: (id: string) => void;
  league: LeagueState;
  leagueStandings: LeagueStandingRow[];
  onClaimLeagueReward: () => void;
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
  onCollectGift,
  onUpgrade,
  calendar,
  onClaimCalendar,
  pass,
  onClaimPass,
  todayKey,
  stats,
  achievementStats,
  blitz,
  bestEndlessScore,
  levelsCleared,
  seenPages,
  onReadStory,
  league,
  leagueStandings,
  onClaimLeagueReward,
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
  const upgradeTarget = nextUpgrade(island);
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
              {/* Season pass: a monthly ladder filled by everything you play */}
              <div data-testid="season-pass" className="ui-inset space-y-1.5 px-2.5 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">
                    {t('Månadens pass')} · {t('{score} poäng', { score: formatNumber(pass.points) })}
                  </span>
                  <button
                    type="button"
                    data-testid="pass-claim"
                    onClick={onClaimPass}
                    disabled={passReached(pass) <= pass.claimed}
                    className="ui-btn ui-btn-yellow px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('Hämta belöningar')}
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                  {PASS_REWARDS.map((reward, i) => (
                    <div
                      key={i}
                      data-reached={i < passReached(pass)}
                      className={`border-2 border-[#111111] px-0.5 py-0.5 text-center font-mono-num text-[11px] font-bold ${
                        i < pass.claimed ? 'bg-[#A6EC98]' : i < passReached(pass) ? 'bg-[#F2CD1C]' : 'bg-[#FFFFFF]/70'
                      }`}
                    >
                      {i < pass.claimed ? '✓' : `+${reward}`}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-semibold text-[#4B4B4B]">
                  {t('Varje spelad omgång, vinst och klart uppdrag ger poäng. {n} poäng per steg, och passet börjar om varje månad.', {
                    n: PASS_STEP,
                  })}
                </p>
              </div>
              {/* Login calendar: one box a day, the seventh is the big one */}
              <div data-testid="calendar" className="ui-inset space-y-1.5 px-2.5 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">{t('Veckokalender')}</span>
                  <button
                    type="button"
                    data-testid="calendar-claim"
                    onClick={onClaimCalendar}
                    disabled={!canClaimCalendar(calendar, todayKey)}
                    className="ui-btn ui-btn-yellow px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {canClaimCalendar(calendar, todayKey) ? t('Öppna dagens lucka') : t('Kom tillbaka i morgon')}
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {CALENDAR_REWARDS.map((reward, i) => {
                    const shown = calendarShown(calendar, todayKey);
                    const isNext = i === shown && canClaimCalendar(calendar, todayKey);
                    return (
                      <div
                        key={i}
                        data-open={i < shown}
                        className={`border-2 border-[#111111] px-0.5 py-1 text-center ${
                          i < shown ? 'bg-[#A6EC98]' : isNext ? 'bg-[#F2CD1C]' : 'bg-[#FFFFFF]/70'
                        }`}
                      >
                        <div className="text-[9px] font-extrabold uppercase">{t('Dag {n}', { n: i + 1 })}</div>
                        <div className="font-mono-num text-xs font-bold">{i < shown ? '✓' : `+${reward}`}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
              <p className="text-xs font-semibold text-[#4B4B4B]">
                {t('Kraften växer på nivå 5 och nivå 10: varje steg träffar {n} rutor till, eller ger ett drag eller en stråle extra.', {
                  n: TIER_EXTRA_CELLS,
                })}
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
                            {' · '}
                            {t('Styrka {n} av 3', { n: powerTier(lvl.level) })}
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
              <IslandScene built={island.built} skin={skin} className="w-full border-[3px] border-[#111111]" />
              {island.built > 0 && (
                <div className="ui-inset flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="min-w-0 text-xs font-bold leading-snug">
                    {t('Öns invånare samlar {n} bonusenergi om dagen ({per} per bygge).', {
                      n: dailyGift(island),
                      per: DAILY_GIFT_PER_BUILDING,
                    })}
                  </span>
                  <button
                    type="button"
                    data-testid="island-gift-btn"
                    onClick={onCollectGift}
                    disabled={!canCollectGift(island, todayKey)}
                    className="ui-btn ui-btn-yellow px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {canCollectGift(island, todayKey) ? t('Hämta dagens gåva') : t('Hämtad i dag')}
                  </button>
                </div>
              )}
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
              {upgradeTarget && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 text-xs font-semibold text-[#4B4B4B]">
                    {t('Ett förbättrat bygge ger dubbel gåva varje dag.')}
                  </span>
                  <button
                    type="button"
                    data-testid="upgrade-btn"
                    onClick={onUpgrade}
                    disabled={free < upgradeTarget.cost}
                    className="ui-btn px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('Förbättra {name} · {n} stjärnor', { name: t(upgradeTarget.nameSv), n: upgradeTarget.cost })}
                  </button>
                </div>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {BUILDINGS.map((building, i) => (
                  <div
                    key={building.id}
                    className={`ui-inset px-2 py-1 text-center text-[11px] font-extrabold ${
                      i < island.built ? '!bg-[#CFF5D2]' : i === island.built ? '' : 'opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {i < island.built && (
                        <span className="h-4 w-4 shrink-0">
                          <GemSvg color={building.resident} special="none" skin={skin} animationSeed={i + 1} />
                        </span>
                      )}
                      <span className="truncate">{t(building.nameSv)}</span>
                    </div>
                    <div className="font-mono-num text-[10px] font-bold text-[#4B4B4B]">
                      {i < upgradedCount(island) ? `${t('Förbättrad')} ★` : i < island.built ? t('Byggd') : `${building.cost} ★`}
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

          {tab === 'league' && (() => {
            const tierDef = getLeagueTier(league.tier);
            const myRow = leagueStandings.find((r) => r.isPlayer);
            return (
              <section data-testid="league-section" className="space-y-3">
                {/* Tier banner & progression */}
                <div className="ui-inset p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border-2 border-[#111111]"
                        style={{ backgroundColor: tierDef.accent }}
                      />
                      <span className="font-display text-lg">{t(tierDef.nameSv)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-extrabold">
                      {myRow && (
                        <span className="rounded border-2 border-[#111111] bg-[#F2CD1C] px-2 py-0.5">
                          {t('Plats #{n}', { n: myRow.rank })}
                        </span>
                      )}
                      {league.trophies > 0 && (
                        <span className="rounded border-2 border-[#111111] bg-[#FFFFFF] px-2 py-0.5">
                          {t('{n} pokaler', { n: league.trophies })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 5-tier ladder */}
                  <div className="grid grid-cols-5 gap-1">
                    {LEAGUE_TIERS.map((tier) => {
                      const active = tier.id === league.tier;
                      return (
                        <div
                          key={tier.id}
                          className={`truncate rounded border-2 border-[#111111] px-1 py-0.5 text-center text-[10px] font-extrabold ${
                            active ? 'text-[#111111] shadow-[2px_2px_0_#111111]' : 'bg-[#FFFFFF]/60 text-[#4B4B4B]'
                          }`}
                          style={active ? { backgroundColor: tier.accent } : undefined}
                        >
                          {t(tier.nameSv)}
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[11px] font-semibold text-[#4B4B4B]">
                    {tierDef.promoteTop > 0
                      ? t('Tjäna ligapoäng från stjärnor, dagliga pussel och utmaningar. Topp {n} går upp nästa vecka!', {
                          n: tierDef.promoteTop,
                        })
                      : t('Du är i högsta ligan! Håll dig kvar i toppen för största veckobelöningen.')}
                  </p>
                </div>

                {/* Claimable last-week reward */}
                {league.pendingReward && (
                  <div
                    data-testid="league-reward-banner"
                    className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-[#111111] bg-[var(--ui-yellow)] px-3 py-2"
                  >
                    <div className="text-xs font-extrabold">
                      {league.pendingReward.outcome === 'promoted'
                        ? t('Uppflyttad till {tier}! Plats #{rank}', {
                            tier: t(getLeagueTier(league.pendingReward.newTier).nameSv),
                            rank: league.pendingReward.rank,
                          })
                        : t('Förra veckans resultat: Plats #{rank}', {
                            rank: league.pendingReward.rank,
                          })}
                    </div>
                    <button
                      type="button"
                      data-testid="claim-league-reward-btn"
                      onClick={onClaimLeagueReward}
                      className="ui-btn ui-btn-green px-3 py-1 text-xs"
                    >
                      {league.pendingReward.energy > 0
                        ? t('Hämta +{n} energi', { n: league.pendingReward.energy })
                        : t('Stäng')}
                    </button>
                  </div>
                )}

                {/* 15-player bracket table */}
                <div className="space-y-1">
                  {leagueStandings.map((row) => (
                    <div
                      key={row.id}
                      data-player={row.isPlayer}
                      className={`flex items-center gap-2 rounded border-2 border-[#111111] px-2.5 py-1 text-xs font-bold ${
                        row.isPlayer
                          ? 'bg-[#F2CD1C] font-extrabold shadow-[2px_2px_0_#111111]'
                          : row.zone === 'promote'
                          ? 'bg-[#D7F7CF]'
                          : row.zone === 'demote'
                          ? 'bg-[#FFD6DC]'
                          : 'bg-[#FFFFFF]/80'
                      }`}
                    >
                      <span className="w-6 text-center font-mono-num font-extrabold">
                        {row.rank}
                      </span>
                      <span className="h-6 w-6 shrink-0">
                        <GemSvg color={row.color} special="none" skin={skin} animationSeed={row.rank * 13} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{row.handle}</span>
                      {row.zone === 'promote' && (
                        <span className="text-[10px] font-extrabold uppercase text-[#0B6B2B]">
                          ▲
                        </span>
                      )}
                      {row.zone === 'demote' && (
                        <span className="text-[10px] font-extrabold uppercase text-[#D4002A]">
                          ▼
                        </span>
                      )}
                      <span className="font-mono-num font-extrabold">
                        {t('{n} p', { n: formatNumber(row.points) })}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
