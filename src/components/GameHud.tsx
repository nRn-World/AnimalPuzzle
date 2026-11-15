import React from 'react';
import { formatNumber, t } from '../i18n';
import { getObjectiveCurrent } from '../game/engine';
import { CAMPAIGN_LEVEL_COUNT } from '../game/levels';
import { UiIcon } from './UiIcon';
import { biomeOfChapter } from '../game/biomes';
import { getCompanion } from '../game/companions';
import { GemColor } from '../game/types';
import {
  AnimalSkinId,
  GameMode,
  LevelConfig,
  LevelProgress,
  TOOL_COSTS,
  ToolType,
} from '../game/types';
import {
  ChainBadgeIcon,
  CrateSvg,
  BossSvg,
  EggSvg,
  GemSvg,
  HoneySvg,
  HammerIcon,
  IceBadgeIcon,
  PulseIcon,
  ShuffleIcon,
} from './GemSvg';

interface GameHudProps {
  level: LevelConfig;
  mode: GameMode;
  skin: AnimalSkinId;
  movesLeft: number;
  progress: LevelProgress;
  energy: number;
  maxEnergy: number;
  lastCascade: number;
  activeTool: ToolType | null;
  muted: boolean;
  isFullscreen?: boolean;
  canFullscreen?: boolean;
  busy: boolean;
  /** Seconds left in the time mode; shown instead of the moves. */
  timeLeft?: number;
  /** The boss has lost half its health and attacks sooner. */
  bossEnraged?: boolean;
  companion: GemColor;
  powerCharge: number;
  powerNeeded: number;
  onFirePower: () => void;
  onSelectTool: (tool: ToolType) => void;
  onHint: () => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onPause: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  level,
  mode,
  skin,
  movesLeft,
  progress,
  energy,
  maxEnergy,
  lastCascade,
  activeTool,
  muted,
  isFullscreen = false,
  canFullscreen = false,
  busy,
  timeLeft,
  bossEnraged = false,
  companion,
  powerCharge,
  powerNeeded,
  onFirePower,
  onSelectTool,
  onHint,
  onToggleMute,
  onToggleFullscreen,
  onPause,
  onRestart,
  onBackToTitle,
}) => {
  const energyPct = Math.min(100, Math.round((energy / maxEnergy) * 100));
  const timed = timeLeft !== undefined;
  const lowMoves = timed ? timeLeft <= 10 : movesLeft <= 4;
  const powerDef = getCompanion(companion);
  const powerReady = powerCharge >= powerNeeded;
  const powerPct = Math.min(100, Math.round((powerCharge / powerNeeded) * 100));

  const blurAfterClick = (e: React.MouseEvent<HTMLButtonElement>, fn: () => void) => {
    e.currentTarget.blur();
    fn();
  };

  const tools: { id: ToolType; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'hammer',
      title: t('Hammare'),
      desc: t('Spräcker 1 ruta gratis'),
      icon: <HammerIcon className="w-9 h-9" />,
    },
    {
      id: 'pulse',
      title: t('Korspuls'),
      desc: t('Rensar hel rad + kolumn'),
      icon: <PulseIcon className="w-9 h-9" />,
    },
    {
      id: 'shuffle',
      title: t('Blanda'),
      desc: t('Nytt läge på brädet'),
      icon: <ShuffleIcon className="w-9 h-9" />,
    },
  ];

  return (
    <aside className="contents">
      {/* Status: floats above the board in portrait, left of it in landscape */}
      <div className="order-1 w-full max-w-[640px] self-center lg:w-[230px] lg:max-w-none shrink-0 flex flex-col gap-2 lg:gap-4 px-1.5 pt-1 lg:p-0">
        {/* Level name + the two in-game buttons */}
        <div className="flex items-center justify-between gap-2 lg:flex-col lg:gap-3">
          <div className="ui-onscene min-w-0 lg:text-center">
            <div className="truncate text-[11px] font-extrabold uppercase tracking-wider leading-tight opacity-90">
              {mode === 'campaign'
                ? t('Nivå {n}/{total}', { n: formatNumber(level.id), total: formatNumber(CAMPAIGN_LEVEL_COUNT) })
                : mode === 'daily'
                ? t('Daglig')
                : mode === 'blitz'
                ? t('60 sekunder')
                : mode === 'weekly'
                ? t('Veckans utmaning')
                : t('Oändligt')}
            </div>
            <h1 className="font-display text-2xl lg:text-3xl truncate leading-tight">
              {t(level.name)}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onHint)}
              disabled={busy}
              title={t('Tips (H)')}
              aria-label={t('Visa tips (H)')}
              className="ui-booster ui-booster-plain w-11 h-11"
            >
              <UiIcon name="question" className="w-5 h-5" />
            </button>
            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-pause-btn"
              onClick={(e) => blurAfterClick(e, onPause)}
              disabled={busy}
              title={t('Paus (P / Esc)')}
              aria-label={t('Pausa spelet')}
              className="ui-booster ui-booster-plain w-11 h-11"
            >
              <UiIcon name="pause" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Moves badge · goals · score */}
        <div className="flex items-center gap-2 lg:flex-col lg:gap-3">
          <div
            className={`ui-moves shrink-0 w-[5.5rem] h-[5.5rem] sm:w-24 sm:h-24 lg:w-32 lg:h-32 ${
              lowMoves ? 'ui-moves-low' : ''
            }`}
            title={timed ? t('Sekunder kvar') : t('Drag kvar')}
          >
            <span
              data-testid="moves-left"
              aria-label={timed ? t('Sekunder kvar') : t('Drag kvar')}
              className="font-display text-5xl lg:text-7xl leading-none"
            >
              {Math.round(timed ? timeLeft : movesLeft)}
            </span>
            <span className="text-[9px] sm:text-[10px] lg:text-xs font-extrabold uppercase tracking-wider leading-none">
              {timed ? t('Sekunder') : t('Drag kvar')}
            </span>
          </div>

          <div
            aria-label={t('Mål')}
            className="ui-inset min-w-0 flex-1 lg:w-full lg:flex-none flex flex-wrap items-center justify-center gap-x-4 gap-y-1 !rounded-2xl px-3 py-2.5 lg:!rounded-lg lg:flex-col lg:items-stretch lg:gap-2 lg:p-2.5"
          >
            <div className="hidden lg:block text-center text-[11px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
              {t('Mål')}
            </div>
            {level.objectives.map((obj, objIdx) => {
              const current = Math.min(obj.target, getObjectiveCurrent(obj, progress));
              const done = current >= obj.target;
              return (
                <div
                  key={obj.id}
                  title={t(obj.label)}
                  className={`relative flex items-center gap-1 lg:gap-2.5 ${
                    obj.kind === 'boss' ? 'w-full pb-3' : ''
                  }`}
                >
                  {obj.kind === 'boss' && (
                    <span
                      data-testid="boss-health"
                      data-enraged={bossEnraged}
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-2.5 border-2 border-[#111111] bg-[#FFFFFF]/70"
                    >
                      <span
                        className={`block h-full origin-left transition-transform duration-300 ${
                          bossEnraged ? 'bg-[#FF2E4D]' : 'bg-[#39D353]'
                        }`}
                        style={{ transform: `scaleX(${Math.max(0, 1 - current / obj.target)})` }}
                      />
                      <span className="absolute inset-y-0 left-1/2 w-0.5 bg-[#111111]" />
                    </span>
                  )}
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                    {obj.kind === 'color' && obj.color && (
                      <GemSvg
                        color={obj.color}
                        special="none"
                        skin={skin}
                        animationSeed={objIdx * 91 + 7}
                        className="w-full h-full"
                      />
                    )}
                    {obj.kind === 'ice' && <IceBadgeIcon className="w-6 h-6 lg:w-8 lg:h-8" />}
                    {obj.kind === 'crate' && <CrateSvg hp={2} className="w-7 h-7 lg:w-9 lg:h-9" />}
                    {obj.kind === 'chain' && <ChainBadgeIcon className="w-6 h-6 lg:w-8 lg:h-8" />}
                    {obj.kind === 'honey' && <HoneySvg className="w-7 h-7 lg:w-9 lg:h-9" />}
                    {obj.kind === 'egg' && <EggSvg className="w-7 h-7 lg:w-9 lg:h-9" />}
                    {obj.kind === 'boss' && (
                      <BossSvg
                        className={`w-9 h-9 lg:w-10 lg:h-10 ${bossEnraged && !done ? 'animate-boss-rage' : ''}`}
                        biome={biomeOfChapter(level.chapter ?? 1)}
                      />
                    )}
                    {(obj.kind === 'score' || obj.kind === 'specials') && (
                      <UiIcon name="star" className="w-6 h-6 lg:w-8 lg:h-8 text-[#E09A00]" />
                    )}
                    {obj.kind === 'cascade3' && (
                      <UiIcon name="exclamation" className="w-6 h-6 lg:w-8 lg:h-8 text-[#0A6FB0]" />
                    )}
                  </div>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${
                      obj.kind === 'boss' ? '' : 'sr-only lg:not-sr-only'
                    }`}
                  >
                    {t(obj.label)}
                    {obj.kind === 'boss' && bossEnraged && !done && (
                      <span className="ml-1 font-extrabold uppercase text-[#D4002A]">· {t('Rasande')}</span>
                    )}
                  </span>
                  <span className="font-display text-2xl leading-none shrink-0">
                    {done ? (
                      <>
                        <UiIcon name="checkmark" className="w-4 h-4 lg:w-5 lg:h-5 text-[#0B6B2B]" />
                        <span className="sr-only">{t('Klar')}</span>
                      </>
                    ) : (
                      <span>
                        {current}/{obj.target}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="ui-onscene shrink-0 text-right lg:w-full lg:text-center">
            <div className="text-[11px] lg:text-xs font-extrabold uppercase tracking-wider leading-none opacity-90">
              {t('Poäng')}
              {lastCascade > 1 && (
                <span className="ml-1 font-mono-num text-[#FDE047]">×{lastCascade}</span>
              )}
            </div>
            <div
              data-testid="score-value"
              className="font-display text-4xl sm:text-5xl lg:text-6xl leading-none mt-1"
            >
              {formatNumber(progress.score)}
            </div>
          </div>
        </div>
      </div>

      {/* Boosters: below the board in portrait, right of it in landscape */}
      <div className="order-3 w-full max-w-[640px] self-center lg:w-[104px] lg:max-w-none shrink-0 flex flex-wrap items-start justify-center gap-x-3 gap-y-2 px-2 pb-1.5 lg:flex-col lg:flex-nowrap lg:items-center lg:gap-5 lg:px-0 lg:pb-0">
        <div className="ui-onscene w-full max-w-[19rem] lg:max-w-none">
          <div className="flex items-center justify-between gap-1 lg:flex-col lg:gap-0.5">
            <span
              title={t('Verktyg (laddas av kaskader)')}
              className="truncate text-[10px] lg:text-xs font-extrabold uppercase tracking-wider"
            >
              {t('Energi')}
            </span>
            <span
              data-testid="energy-value"
              className="font-mono-num text-[11px] lg:text-xs font-bold text-[#FDE047]"
            >
              {Math.round(energy)}/{maxEnergy}
            </span>
          </div>
          <div className="mt-1 w-full h-3 bg-[#1B2147] rounded-sm overflow-hidden border-2 border-[#111111]">
            <div
              className="h-full bg-[#F2CD1C] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${energyPct / 100})` }}
            />
          </div>
        </div>

        {/* The companion: charges as animals are cleared, then strikes for free */}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            data-testid="power-btn"
            data-ready={powerReady}
            disabled={!powerReady || busy}
            onClick={(e) => blurAfterClick(e, onFirePower)}
            title={`${t(powerDef.powerSv)} – ${t(powerDef.descSv)}`}
            aria-label={t('{power} ({pct} % laddad): {desc}', {
              power: t(powerDef.powerSv),
              pct: powerPct,
              desc: t(powerDef.descSv),
            })}
            className={`ui-power relative shrink-0 w-[4.5rem] h-[4.5rem] lg:w-20 lg:h-20 ${
              powerReady ? 'ui-power-ready' : ''
            }`}
            style={{ '--charge': `${powerPct}%` } as React.CSSProperties}
          >
            <span className="ui-power-face">
              <GemSvg color={companion} special="none" skin={skin} animationSeed={5} className="h-full w-full" />
            </span>
            <span className="ui-booster-cost font-mono-num">{powerReady ? t('Klar') : `${powerPct}%`}</span>
          </button>
          <span className="ui-onscene max-w-[5rem] truncate text-[11px] font-extrabold leading-none">
            {t(powerDef.powerSv)}
          </span>
        </div>

        {tools.map((tool) => {
          const cost = TOOL_COSTS[tool.id];
          const ready = energy >= cost && !busy;
          const selected = activeTool === tool.id;
          return (
            <div key={tool.id} className="flex flex-col items-center gap-1">
              <button
              type="button"
              disabled={!ready && !selected}
              onClick={(e) => blurAfterClick(e, () => onSelectTool(tool.id))}
              aria-pressed={selected}
              title={`${tool.title} – ${tool.desc}`}
              aria-label={t('{tool} ({cost} energi): {desc}', { tool: tool.title, cost, desc: tool.desc })}
              className={`ui-booster relative shrink-0 w-[4.5rem] h-[4.5rem] lg:w-20 lg:h-20 ${
                selected ? 'ui-booster-active' : ''
              }`}
            >
              {tool.icon}
              <span className="ui-booster-cost font-mono-num">{cost}</span>
            </button>
              <span className="ui-onscene text-[11px] font-extrabold leading-none">
                {tool.title}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
