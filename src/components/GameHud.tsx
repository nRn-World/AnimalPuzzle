import React from 'react';
import { getObjectiveCurrent } from '../game/engine';
import { CAMPAIGN_LEVELS } from '../game/levels';
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
  GemSvg,
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
  onSelectTool: (tool: ToolType) => void;
  onHint: () => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onPause: () => void;
  onRestart: () => void;
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
  onSelectTool,
  onHint,
  onToggleMute,
  onToggleFullscreen,
  onPause,
  onRestart,
}) => {
  const energyPct = Math.min(100, Math.round((energy / maxEnergy) * 100));
  const lowMoves = movesLeft <= 4;

  const blurAfterClick = (e: React.MouseEvent<HTMLButtonElement>, fn: () => void) => {
    e.currentTarget.blur();
    fn();
  };

  return (
    <aside className="contents lg:w-[340px] lg:shrink-0 lg:flex lg:flex-col lg:gap-3 lg:min-h-0 lg:overflow-y-auto lg:bg-gradient-to-b lg:from-[#19202F] lg:to-[#131824] lg:border lg:border-white/15 lg:border-b-[6px] lg:border-b-[#080B12] lg:shadow-[0_20px_40px_rgba(0,0,0,0.65)] lg:rounded-2xl lg:p-4">
      {/* Top HUD Section: Order 1 on Mobile APK portrait, Top of Sidebar on Desktop */}
      <div className="order-1 lg:order-none w-full shrink-0 flex flex-col gap-1.5 lg:gap-3 bg-gradient-to-b from-[#19202F]/95 to-[#131824]/95 border border-white/15 border-b-[3px] border-b-[#080B12] rounded-xl px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.5)] lg:bg-none lg:border-0 lg:rounded-none lg:p-0 lg:shadow-none">
        {/* Header row: Level title + Utility icon controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1] leading-tight">
              {mode === 'campaign'
                ? `Nivå ${level.id} av ${CAMPAIGN_LEVELS.length}`
                : mode === 'daily'
                ? 'Daglig utmaning'
                : 'Oändligt läge'}
            </div>
            <h1 className="font-display text-sm sm:text-[17px] font-bold text-white truncate leading-tight">
              {level.name}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onHint)}
              disabled={busy}
              title="Tips (H)"
              aria-label="Visa tips (H)"
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1E2535] hover:bg-[#293247] text-[#E2E8F0] border border-white/10 transition-colors cursor-pointer disabled:opacity-45"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.5 1.2 1.3 1.4 2.1h4.2c.2-.8.7-1.6 1.4-2.1A6 6 0 0 0 12 3z" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onToggleMute)}
              title={muted ? 'Slå på ljud (M)' : 'Stäng av ljud (M)'}
              aria-label={muted ? 'Slå på ljud' : 'Stäng av ljud'}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1E2535] hover:bg-[#293247] text-[#E2E8F0] border border-white/10 transition-colors cursor-pointer"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
                </svg>
              )}
            </button>

            {canFullscreen && onToggleFullscreen && (
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-fullscreen-btn"
                onClick={(e) => blurAfterClick(e, onToggleFullscreen)}
                title={isFullscreen ? 'Avsluta hel skärm (F)' : 'Visa i hel skärm (F)'}
                aria-label={isFullscreen ? 'Avsluta hel skärm' : 'Visa i hel skärm'}
                aria-pressed={isFullscreen}
                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-colors cursor-pointer ${
                  isFullscreen
                    ? 'bg-[#2C2416] text-[#FDE047] border-[#F5B841]/60'
                    : 'bg-[#1E2535] hover:bg-[#293247] text-[#E2E8F0] border-white/10'
                }`}
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                )}
              </button>
            )}

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onRestart)}
              title="Starta om (R)"
              aria-label="Starta om nivå"
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1E2535] hover:bg-[#293247] text-[#E2E8F0] border border-white/10 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => blurAfterClick(e, onPause)}
              title="Paus (P / Esc)"
              aria-label="Pausa spelet"
              className="w-8 h-8 flex items-center justify-center rounded-md bg-[#1E2535] hover:bg-[#293247] text-[#E2E8F0] border border-white/10 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hero Readout Strip: Moves & Score */}
        <div className="grid grid-cols-2 gap-2 lg:gap-2.5 lg:pt-1">
          <div className="bg-[#1C2436] border border-white/10 border-b-[2px] lg:border-b-[3px] border-b-[#0A0E17] rounded-lg lg:rounded-xl px-2.5 py-1.5 lg:px-3.5 lg:py-2.5 flex lg:block items-center justify-between">
            <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]">
              Drag kvar
            </div>
            <div
              data-testid="moves-left"
              className={`font-mono-num text-xl lg:text-3xl font-bold leading-none lg:leading-tight lg:mt-0.5 ${
                lowMoves ? 'text-[#F87171]' : 'text-[#FDE047]'
              }`}
            >
              {Math.round(movesLeft)}
            </div>
          </div>

          <div className="bg-[#1C2436] border border-white/10 border-b-[2px] lg:border-b-[3px] border-b-[#0A0E17] rounded-lg lg:rounded-xl px-2.5 py-1.5 lg:px-3.5 lg:py-2.5 flex lg:block items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 lg:justify-between">
              <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]">
                Poäng
              </span>
              {lastCascade > 1 && (
                <span className="font-mono-num text-[11px] lg:text-xs font-bold text-[#FDE047]">
                  ×{lastCascade}
                </span>
              )}
            </div>
            <div
              data-testid="score-value"
              className="font-mono-num text-lg sm:text-xl lg:text-3xl font-bold leading-none lg:leading-tight lg:mt-0.5 text-white"
            >
              {Math.round(progress.score).toLocaleString('sv-SE')}
            </div>
          </div>
        </div>

        {/* Objectives List */}
        <div className="space-y-1 lg:space-y-2 lg:pt-1">
          <div className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]">
            Mål
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-1.5 lg:gap-2">
            {level.objectives.map((obj, objIdx) => {
              const current = Math.min(obj.target, getObjectiveCurrent(obj, progress));
              const done = current >= obj.target;
              return (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between gap-1.5 lg:gap-2.5 px-2 py-1 lg:px-3 lg:py-2 rounded-lg border transition-colors ${
                    done
                      ? 'bg-[#103828]/60 border-[#19B87A]/40'
                      : 'bg-[#1C2230] border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5 lg:gap-2.5 min-w-0">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 shrink-0 flex items-center justify-center">
                      {obj.kind === 'color' && obj.color && (
                        <GemSvg
                          color={obj.color}
                          special="none"
                          skin={skin}
                          animationSeed={objIdx * 91 + 7}
                          className="w-full h-full"
                        />
                      )}
                      {obj.kind === 'ice' && <IceBadgeIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
                      {obj.kind === 'crate' && <CrateSvg hp={2} className="w-5 h-5 lg:w-6 lg:h-6" />}
                      {obj.kind === 'chain' && <ChainBadgeIcon className="w-4 h-4 lg:w-5 lg:h-5" />}
                      {(obj.kind === 'score' || obj.kind === 'specials') && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 lg:w-5 lg:h-5 text-[#F5B841]" fill="currentColor">
                          <polygon points="12,2 15,9 22,9.5 16.5,14.5 18.2,22 12,18 5.8,22 7.5,14.5 2,9.5 9,9" />
                        </svg>
                      )}
                      {obj.kind === 'cascade3' && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 lg:w-5 lg:h-5 text-[#38BDF8]" fill="currentColor">
                          <polygon points="13,2 4,14 11,14 10,22 20,10 13,10" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs lg:text-sm font-medium text-[#E2E8F0] truncate">
                      {obj.label}
                    </span>
                  </div>
                  <div className="font-mono-num text-xs lg:text-sm font-bold shrink-0 text-white">
                    {done ? (
                      <span className="text-[#34D399]">Klar</span>
                    ) : (
                      <span>
                        {current}/{obj.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tactical Skill-Charged Tools Dock: Order 3 Bottom Bar on Mobile APK, Bottom of Sidebar on Desktop */}
      <div className="order-3 lg:order-none lg:mt-auto w-full shrink-0 space-y-1.5 lg:space-y-2.5 bg-gradient-to-b from-[#19202F]/95 to-[#131824]/95 border border-white/15 border-b-[4px] border-b-[#080B12] rounded-xl px-2.5 py-2 sm:px-3 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] lg:bg-none lg:border-0 lg:rounded-none lg:p-0 lg:pt-2 lg:border-t lg:border-white/10 lg:shadow-none">
        <div className="flex items-center justify-between">
          <span className="text-[10px] lg:text-[11px] font-bold uppercase tracking-wider text-[#CBD5E1]">
            Verktyg (laddas av kaskader)
          </span>
          <span
            data-testid="energy-value"
            className="font-mono-num text-[11px] lg:text-xs font-bold text-[#FDE047]"
          >
            {Math.round(energy)}/{maxEnergy}
          </span>
        </div>

        {/* Energy meter */}
        <div className="w-full h-1.5 lg:h-2 bg-[#22293A] rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-[#F5B841] transition-transform duration-200 origin-left"
            style={{ transform: `scaleX(${energyPct / 100})` }}
          />
        </div>

        <div className="grid grid-cols-3 lg:grid-cols-1 gap-1.5 lg:gap-2">
          {(
            [
              {
                id: 'hammer' as ToolType,
                keyHint: '1',
                title: 'Hammare',
                desc: 'Spräcker 1 ruta gratis',
                icon: <HammerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
              },
              {
                id: 'pulse' as ToolType,
                keyHint: '2',
                title: 'Korspuls',
                desc: 'Rensar hel rad + kolumn',
                icon: <PulseIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
              },
              {
                id: 'shuffle' as ToolType,
                keyHint: '3',
                title: 'Blanda',
                desc: 'Nytt läge på brädet',
                icon: <ShuffleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />,
              },
            ]
          ).map((tool) => {
            const cost = TOOL_COSTS[tool.id];
            const ready = energy >= cost && !busy;
            const selected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                disabled={!ready && !selected}
                onClick={(e) => blurAfterClick(e, () => onSelectTool(tool.id))}
                aria-pressed={selected}
                aria-label={`${tool.title} (${cost} energi): ${tool.desc}`}
                className={`flex flex-row items-center justify-between gap-1 lg:gap-2 px-1.5 py-1.5 sm:px-2 lg:px-3 lg:py-2 rounded-lg lg:rounded-xl border border-b-[3px] text-left transition-all cursor-pointer ${
                  selected
                    ? 'bg-[#2C2416] border-[#F5B841] border-b-[#9A6A12] text-white'
                    : ready
                    ? 'bg-[#1D2537] hover:bg-[#27324A] hover:-translate-y-0.5 active:translate-y-0.5 border-white/20 border-b-[#090D16] text-white'
                    : 'bg-[#161C29] border-white/10 border-b-[#0A0D14] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2.5 min-w-0">
                  <span className="shrink-0">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] sm:text-xs lg:text-sm font-bold whitespace-nowrap">
                      {tool.title}
                    </div>
                    <div className="hidden lg:block text-[11px] text-[#CBD5E1] truncate">
                      {tool.desc}
                    </div>
                  </div>
                </div>
                <span className="font-mono-num text-[10px] sm:text-[11px] lg:text-xs font-bold shrink-0 opacity-90">
                  {cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
