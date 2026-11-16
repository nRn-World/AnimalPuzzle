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
  /** A short line the companion says, shown as a speech bubble. */
  companionSay?: { text: string; id: number } | null;
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
  isFullscreen = false,
  canFullscreen = false,
  busy,
  timeLeft,
  bossEnraged = false,
  companion,
  companionSay = null,
  powerCharge,
  powerNeeded,
  onFirePower,
  onSelectTool,
  onHint,
  onToggleFullscreen,
  onPause,
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
      icon: <HammerIcon className="ui-play-tool-icon" />,
    },
    {
      id: 'pulse',
      title: t('Korspuls'),
      desc: t('Rensar hel rad + kolumn'),
      icon: <PulseIcon className="ui-play-tool-icon" />,
    },
    {
      id: 'shuffle',
      title: t('Blanda'),
      desc: t('Nytt läge på brädet'),
      icon: <ShuffleIcon className="ui-play-tool-icon" />,
    },
  ];

  return (
    <aside className="contents">
      {/* Status: floats above the board in portrait, left of it in landscape */}
      <div className="ui-play-status order-1 shrink-0">
        {/* Level name + in-game action buttons */}
        <div className="ui-play-header">
          <div className="ui-play-title-block ui-onscene min-w-0">
            <div className="truncate text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-tight opacity-90">
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
            <h1 className="ui-play-level-name font-display truncate leading-tight">
              {t(level.name)}
            </h1>
          </div>

          <div className="ui-play-actions flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onHint)}
              disabled={busy}
              title={t('Tips (H)')}
              aria-label={t('Visa tips (H)')}
              className="ui-booster ui-booster-plain ui-play-action-btn"
            >
              <UiIcon name="question" className="ui-play-action-icon" />
            </button>
            {canFullscreen && onToggleFullscreen && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-fullscreen-btn"
                onClick={(e) => blurAfterClick(e, onToggleFullscreen)}
                aria-pressed={isFullscreen}
                title={isFullscreen ? t('Avsluta hel skärm') : t('Hel skärm')}
                aria-label={isFullscreen ? t('Avsluta hel skärm') : t('Visa i hel skärm')}
                className="ui-booster ui-booster-plain ui-play-action-btn"
              >
                <UiIcon name={isFullscreen ? 'smaller' : 'larger'} className="ui-play-action-icon" />
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              data-testid="hud-pause-btn"
              onClick={(e) => blurAfterClick(e, onPause)}
              disabled={busy}
              title={t('Paus (P / Esc)')}
              aria-label={t('Pausa spelet')}
              className="ui-booster ui-booster-plain ui-play-action-btn"
            >
              <UiIcon name="pause" className="ui-play-action-icon" />
            </button>
          </div>
        </div>

        {/* Moves badge · goals · score */}
        <div className="ui-play-metrics">
          <div
            className={`ui-moves ui-play-moves shrink-0 ${
              lowMoves ? 'ui-moves-low' : ''
            }`}
            title={timed ? t('Sekunder kvar') : t('Drag kvar')}
          >
            <span
              data-testid="moves-left"
              aria-label={timed ? t('Sekunder kvar') : t('Drag kvar')}
              className="ui-play-moves-num font-display leading-none"
            >
              {Math.round(timed ? timeLeft : movesLeft)}
            </span>
            <span className="ui-play-moves-label font-extrabold uppercase tracking-wider leading-none">
              {timed ? t('Sekunder') : t('Drag kvar')}
            </span>
          </div>

          <div
            aria-label={t('Mål')}
            className="ui-inset ui-play-goals min-w-0"
          >
            <div className="ui-play-goals-heading text-center text-[11px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
              {t('Mål')}
            </div>
            {level.objectives.map((obj, objIdx) => {
              const current = Math.min(obj.target, getObjectiveCurrent(obj, progress));
              const done = current >= obj.target;
              return (
                <div
                  key={obj.id}
                  title={t(obj.label)}
                  className={`ui-play-goal-row relative flex items-center ${
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
                  <div className="ui-play-goal-icon shrink-0 flex items-center justify-center">
                    {obj.kind === 'color' && obj.color && (
                      <GemSvg
                        color={obj.color}
                        special="none"
                        skin={skin}
                        animationSeed={objIdx * 91 + 7}
                        className="w-full h-full"
                      />
                    )}
                    {obj.kind === 'ice' && <IceBadgeIcon className="w-4/5 h-4/5" />}
                    {obj.kind === 'crate' && <CrateSvg hp={2} className="w-[85%] h-[85%]" />}
                    {obj.kind === 'chain' && <ChainBadgeIcon className="w-4/5 h-4/5" />}
                    {obj.kind === 'honey' && <HoneySvg className="w-[85%] h-[85%]" />}
                    {obj.kind === 'egg' && <EggSvg className="w-[85%] h-[85%]" />}
                    {obj.kind === 'boss' && (
                      <BossSvg
                        className={`w-full h-full ${bossEnraged && !done ? 'animate-boss-rage' : ''}`}
                        biome={biomeOfChapter(level.chapter ?? 1)}
                      />
                    )}
                    {(obj.kind === 'score' || obj.kind === 'specials') && (
                      <UiIcon name="star" className="w-3/4 h-3/4 text-[#E09A00]" />
                    )}
                    {obj.kind === 'cascade3' && (
                      <UiIcon name="exclamation" className="w-3/4 h-3/4 text-[#0A6FB0]" />
                    )}
                  </div>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${
                      obj.kind === 'boss' ? '' : 'ui-play-goal-label'
                    }`}
                  >
                    {t(obj.label)}
                    {obj.kind === 'boss' && bossEnraged && !done && (
                      <span className="ml-1 font-extrabold uppercase text-[#D4002A]">· {t('Rasande')}</span>
                    )}
                  </span>
                  <span className="ui-play-goal-value font-display leading-none shrink-0">
                    {done ? (
                      <>
                        <UiIcon name="checkmark" className="w-4 h-4 text-[#0B6B2B]" />
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

          <div className="ui-onscene ui-play-score shrink-0">
            <div className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider leading-none opacity-90">
              {t('Poäng')}
              {lastCascade > 1 && (
                <span className="ml-1 font-mono-num text-[#FDE047]">×{lastCascade}</span>
              )}
            </div>
            <div
              data-testid="score-value"
              className="ui-play-score-val font-display leading-none mt-0.5"
            >
              {formatNumber(progress.score)}
            </div>
          </div>
        </div>
      </div>

      {/* Boosters: below the board in portrait, right of it in landscape */}
      <div className="ui-play-boosters order-3 shrink-0">
        <div className="ui-onscene ui-play-energy">
          <div className="ui-play-energy-head flex items-center justify-between gap-1">
            <span
              title={t('Verktyg (laddas av kaskader)')}
              className="truncate text-[10px] font-extrabold uppercase tracking-wider"
            >
              {t('Energi')}
            </span>
            <span
              data-testid="energy-value"
              className="font-mono-num text-[11px] font-bold text-[#FDE047]"
            >
              {Math.round(energy)}/{maxEnergy}
            </span>
          </div>
          <div className="mt-0.5 w-full h-2.5 bg-[#1B2147] rounded-sm overflow-hidden border-2 border-[#111111]">
            <div
              className="h-full bg-[#F2CD1C] transition-transform duration-200 origin-left"
              style={{ transform: `scaleX(${energyPct / 100})` }}
            />
          </div>
        </div>

        <div className="ui-play-tools">
          {/* The companion: charges as animals are cleared, then strikes for free */}
          <div className="ui-play-tool-item relative flex flex-col items-center gap-0.5">
            {companionSay && (
              <span
                key={companionSay.id}
                data-testid="companion-say"
                role="status"
                className="ui-speech ui-play-speech animate-menu-pop pointer-events-none absolute bottom-full z-20 mb-1 w-max max-w-[150px] text-center text-[11px] font-extrabold leading-tight"
              >
                {t(companionSay.text)}
              </span>
            )}
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
              className={`ui-power ui-play-booster-btn relative shrink-0 ${
                powerReady ? 'ui-power-ready' : ''
              }`}
              style={{ '--charge': `${powerPct}%` } as React.CSSProperties}
            >
              <span className="ui-power-face">
                <GemSvg color={companion} special="none" skin={skin} animationSeed={5} className="h-full w-full" />
              </span>
              <span className="ui-booster-cost font-mono-num">{powerReady ? t('Klar') : `${powerPct}%`}</span>
            </button>
            <span className="ui-onscene ui-play-tool-label truncate font-extrabold leading-none">
              {t(powerDef.powerSv)}
            </span>
          </div>

          {tools.map((tool) => {
            const cost = TOOL_COSTS[tool.id];
            const ready = energy >= cost && !busy;
            const selected = activeTool === tool.id;
            return (
              <div key={tool.id} className="ui-play-tool-item flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  disabled={!ready && !selected}
                  onClick={(e) => blurAfterClick(e, () => onSelectTool(tool.id))}
                  aria-pressed={selected}
                  title={`${tool.title} – ${tool.desc}`}
                  aria-label={t('{tool} ({cost} energi): {desc}', { tool: tool.title, cost, desc: tool.desc })}
                  className={`ui-booster ui-play-booster-btn relative shrink-0 ${
                    selected ? 'ui-booster-active' : ''
                  }`}
                >
                  {tool.icon}
                  <span className="ui-booster-cost font-mono-num">{cost}</span>
                </button>
                <span className="ui-onscene ui-play-tool-label truncate font-extrabold leading-none">
                  {tool.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
