import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { prefersReducedMotion } from '../game/settings';
import { TutorialPrompt } from '../game/tutorial';
import { useSettings } from '../hooks/useSettings';
import { t } from '../i18n';
import {
  AnimalSkinId,
  BOARD_SIZE,
  Board,
  Coord,
  GEM_META,
  SpecialType,
  ToolType,
} from '../game/types';
import { CrateSvg, EggSvg, GemSvg, HoneySvg } from './GemSvg';
import { ParticleCanvas, ParticleCanvasHandle } from './ParticleCanvas';

export type BoardTransitionMode = 'none' | 'swap' | 'fall';

/** Screen-reader names for the special pieces (Swedish source strings). */
const SPECIAL_LABELS: Record<Exclude<SpecialType, 'none'>, string> = {
  beam_h: 'Vågrät stråle',
  beam_v: 'Lodrät stråle',
  nova: 'Nova',
  scout: 'Flygare',
  prism: 'Prisma',
};

interface GameBoardProps {
  board: Board;
  transitionMode: BoardTransitionMode;
  skin: AnimalSkinId;
  selected: Coord | null;
  hintPair: [Coord, Coord] | null;
  tutorialPrompt?: TutorialPrompt | null;
  clearingKeys: Set<string>;
  invalidPair: [Coord, Coord] | null;
  activeTool: ToolType | null;
  shaking: boolean;
  busy: boolean;
  fxRef: React.RefObject<ParticleCanvasHandle | null>;
  onCellClick: (coord: Coord) => void;
  onSwipeSwap: (from: Coord, to: Coord) => void;
  onBoardTilt?: (nx: number, ny: number) => void;
  /** Pixel width of the board, measured from the available viewport space. */
  size?: number;
  /** Pixel height; defaults to the width (square board). */
  height?: number;
}

interface GemMotionProps {
  dxCols: number;
  dyRows: number;
  durationMs: number;
  clearing: boolean;
  isSelected: boolean;
  hinted: boolean;
  isSpecial: boolean;
  children: React.ReactNode;
}

const GemMotion: React.FC<GemMotionProps> = ({
  dxCols,
  dyRows,
  durationMs,
  clearing,
  isSelected,
  hinted,
  isSpecial,
  children,
}) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  const landed = dxCols !== 0 || dyRows !== 0;

  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (dxCols === 0 && dyRows === 0) return;
    if (prefersReducedMotion()) return;

    el.style.transition = 'none';
    el.style.transform = `translate3d(calc(${dxCols} * (100% + 5px)), calc(${dyRows} * (100% + 5px)), 14px)`;

    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!elRef.current) return;
        elRef.current.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        elRef.current.style.transform = 'translate3d(0, 0, 0)';
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [dxCols, dyRows, durationMs]);

  return (
    <div
      ref={elRef}
      className={`relative z-10 w-full h-full p-[3px] will-change-transform ${
        clearing
          ? 'animate-gem-clear'
          : isSelected
          ? '-translate-y-1 scale-110 transition-transform duration-150'
          : hinted
          ? 'animate-hint-pulse'
          : 'transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:scale-[1.06] group-active:translate-y-0.5 group-active:scale-[0.95]'
      }`}
    >
      <div
        className={`relative w-full h-full rounded-lg flex items-center justify-center p-[2px] border-t border-white/25 border-b-[3px] border-b-black/50 transition-shadow duration-150 ${
          isSelected
            ? 'bg-gradient-to-b from-[#F5B841]/30 to-[#161A25]/85 shadow-[0_8px_16px_rgba(245,184,65,0.42)]'
            : isSpecial
            ? 'bg-gradient-to-b from-white/18 to-black/35 shadow-[0_4px_10px_rgba(253,224,71,0.28)]'
            : 'bg-gradient-to-b from-white/12 to-black/35 shadow-[0_3px_5px_rgba(0,0,0,0.55)]'
        } ${landed && !clearing ? 'animate-gem-land' : ''}`}
        style={
          landed && !clearing
            ? { animationDelay: `${Math.max(0, durationMs - 40)}ms` }
            : undefined
        }
      >
        {isSpecial && !clearing && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[2px] rounded-lg border border-[#FDE047]/65 animate-aura-spin"
            style={{
              background:
                'radial-gradient(circle at 50% 30%, rgba(253,224,71,0.2), transparent 68%)',
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  transitionMode,
  skin,
  selected,
  hintPair,
  tutorialPrompt = null,
  clearingKeys,
  invalidPair,
  activeTool,
  shaking,
  busy,
  fxRef,
  onCellClick,
  onSwipeSwap,
  onBoardTilt,
  size,
  height,
}) => {
  const dragStartRef = useRef<{ coord: Coord; x: number; y: number } | null>(null);
  const swipeTriggeredRef = useRef(false);
  const prevBoardPositionsRef = useRef<Map<number, Coord>>(new Map());
  const tiltRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const tiltTargetRef = useRef({ rx: 0, ry: 0, sx: 50, sy: 50 });
  const tiltCurrRef = useRef({ rx: 0, ry: 0, sx: 50, sy: 50 });
  const { reduceMotion } = useSettings();

  // Smoothly interpolate 3D pedestal tilt at 60fps without React re-renders
  useEffect(() => {
    if (prefersReducedMotion()) return;

    let rafId = 0;
    const step = () => {
      const target = tiltTargetRef.current;
      const curr = tiltCurrRef.current;
      curr.rx += (target.rx - curr.rx) * 0.14;
      curr.ry += (target.ry - curr.ry) * 0.14;
      curr.sx += (target.sx - curr.sx) * 0.14;
      curr.sy += (target.sy - curr.sy) * 0.14;

      if (tiltRef.current) {
        tiltRef.current.style.transform = `rotateX(${curr.rx.toFixed(2)}deg) rotateY(${curr.ry.toFixed(2)}deg)`;
      }
      if (sheenRef.current) {
        sheenRef.current.style.background = `radial-gradient(circle at ${curr.sx.toFixed(1)}% ${curr.sy.toFixed(1)}%, rgba(255,255,255,0.10) 0%, rgba(245,184,65,0.03) 35%, transparent 65%)`;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      // Level the pedestal again if the tilt is switched off mid-game.
      if (tiltRef.current) tiltRef.current.style.transform = '';
    };
  }, [reduceMotion]);

  // Compute per-gem entry offsets relative to previous rendered board
  const gemOffsets = useMemo(() => {
    const offsets = new Map<number, { dx: number; dy: number }>();
    const prevMap = prevBoardPositionsRef.current;

    if (transitionMode !== 'none' && prevMap.size > 0) {
      const newCountInCol = new Array(BOARD_SIZE).fill(0);
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const gem = board[r][c].gem;
          if (gem && gem.special === 'none' && !prevMap.has(gem.id)) {
            newCountInCol[c]++;
          }
        }
      }

      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const gem = board[r][c].gem;
          if (!gem) continue;
          const prev = prevMap.get(gem.id);
          if (prev) {
            const dx = prev.col - c;
            const dy = prev.row - r;
            if (dx !== 0 || dy !== 0) {
              offsets.set(gem.id, { dx, dy });
            }
          } else if (transitionMode === 'fall' && gem.special === 'none') {
            offsets.set(gem.id, { dx: 0, dy: -Math.max(1, newCountInCol[c]) });
          }
        }
      }
    }

    return offsets;
  }, [board, transitionMode]);

  useLayoutEffect(() => {
    const nextMap = new Map<number, Coord>();
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const gem = board[r][c].gem;
        if (gem) {
          nextMap.set(gem.id, { row: r, col: c });
        }
      }
    }
    prevBoardPositionsRef.current = nextMap;
  }, [board]);

  const motionDurationMs = transitionMode === 'swap' ? 230 : 300;

  const handlePointerDown = (coord: Coord, e: React.PointerEvent<HTMLButtonElement>) => {
    if (busy || activeTool) return;
    dragStartRef.current = { coord, x: e.clientX, y: e.clientY };
    swipeTriggeredRef.current = false;
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        tiltTargetRef.current = {
          rx: -ny * 4.0,
          ry: nx * 4.0,
          sx: 50 + nx * 35,
          sy: 50 + ny * 35,
        };
        onBoardTilt?.(nx, ny);
      }
    }

    if (!dragStartRef.current || swipeTriggeredRef.current || busy || activeTool) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const threshold = 20;

    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

    const { coord } = dragStartRef.current;
    let target: Coord | null = null;
    if (Math.abs(dx) >= Math.abs(dy)) {
      target = { row: coord.row, col: coord.col + (dx > 0 ? 1 : -1) };
    } else {
      target = { row: coord.row + (dy > 0 ? 1 : -1), col: coord.col };
    }

    if (target.row >= 0 && target.row < 8 && target.col >= 0 && target.col < 8) {
      swipeTriggeredRef.current = true;
      dragStartRef.current = null;
      onSwipeSwap(coord, target);
    }
  };

  const handleBoardPointerLeave = () => {
    dragStartRef.current = null;
    tiltTargetRef.current = { rx: 0, ry: 0, sx: 50, sy: 50 };
    onBoardTilt?.(0, 0);
  };

  const handlePointerUp = () => {
    dragStartRef.current = null;
  };

  const handleKeyDown = (coord: Coord, e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (busy) return;
    let nr = coord.row;
    let nc = coord.col;
    if (e.key === 'ArrowUp') nr = Math.max(0, coord.row - 1);
    else if (e.key === 'ArrowDown') nr = Math.min(7, coord.row + 1);
    else if (e.key === 'ArrowLeft') nc = Math.max(0, coord.col - 1);
    else if (e.key === 'ArrowRight') nc = Math.min(7, coord.col + 1);
    else return;

    e.preventDefault();
    const nextBtn = document.querySelector<HTMLButtonElement>(
      `button[data-row="${nr}"][data-col="${nc}"]`
    );
    nextBtn?.focus();
  };

  const isHinted = (r: number, c: number) =>
    hintPair !== null &&
    ((hintPair[0].row === r && hintPair[0].col === c) ||
      (hintPair[1].row === r && hintPair[1].col === c));

  const isInvalid = (r: number, c: number) =>
    invalidPair !== null &&
    ((invalidPair[0].row === r && invalidPair[0].col === c) ||
      (invalidPair[1].row === r && invalidPair[1].col === c));

  return (
    <div className="perspective-stage relative w-full flex flex-col items-center justify-center">
      {activeTool && (
        <div className="mb-1.5 text-center text-[11px] sm:text-sm font-bold text-[#FDE047] px-2">
          {activeTool === 'hammer'
            ? t('Välj en ruta på brädet att spräcka med Hammaren')
            : t('Välj en ruta för att utlösa Korspuls längs rad & kolumn')}
        </div>
      )}

      {/* 3D Tilting Pedestal Frame */}
      <div
        ref={tiltRef}
        onPointerMove={handleBoardPointerMove}
        onPointerLeave={handleBoardPointerLeave}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={size ? { width: size, height: height ?? size } : undefined}
        className={`preserve-3d relative p-1.5 sm:p-3 lg:p-3.5 rounded-lg bg-[#0B1030]/75 backdrop-blur-[2px] border-[3px] sm:border-4 ${
          activeTool
            ? 'border-[#FF2E4D] shadow-[6px_6px_0_#FF2E4D]'
            : 'border-[#C9CED6] shadow-[6px_6px_0_#111111]'
        } select-none ${
          shaking ? 'animate-board-shake' : ''
        }`}
      >
        {/* Dynamic specular rim sheen responding to 3D tilt */}
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl sm:rounded-2xl z-30"
        />

        {/* 8x8 Interactive Recessed 3D Grid */}
        <div
          data-testid="game-board"
          role="grid"
          aria-label={t('AnimalPuzzle spelbräde 8 gånger 8')}
          style={{ gridTemplateRows: 'repeat(8, minmax(0, 1fr))' }}
          className="relative overflow-hidden rounded sm:rounded-md p-1 bg-[#111111] border-2 border-[#111111] grid grid-cols-8 gap-0.5 sm:gap-1.5 w-full h-full"
        >
          {board.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const isSelected = selected?.row === r && selected?.col === c;
              const hinted = isHinted(r, c);
              const invalid = isInvalid(r, c);
              const clearing = clearingKeys.has(key);

              const labelParts = [t('Rad {row} kolumn {col}', { row: r + 1, col: c + 1 })];
              const isHole = cell.block === 'hole';
              if (isHole) {
                labelParts.push(t('Hål'));
              } else if (cell.block === 'honey') {
                labelParts.push(t('Honung'));
              } else if (cell.crate > 0) {
                labelParts.push(t('Trälåda nivå {n}', { n: cell.crate }));
              } else if (cell.gem?.egg) {
                labelParts.push(t('Ägg'));
              } else if (cell.gem) {
                labelParts.push(t(GEM_META[cell.gem.color].nameSv));
                if (cell.gem.special !== 'none') labelParts.push(t(SPECIAL_LABELS[cell.gem.special]));
                if (cell.gem.chained) labelParts.push(t('Kedjad'));
                if (cell.gem.bomb !== undefined) labelParts.push(t('Bomb, {n} drag kvar', { n: cell.gem.bomb }));
              }
              if (cell.ice > 0) labelParts.push(t('Is nivå {n}', { n: cell.ice }));
              if (cell.portal) labelParts.push(t('Portalruta'));
              if (cell.belt) labelParts.push(t('Rullband'));

              const checkerboardDark = (r + c) % 2 === 0;
              const delta = cell.gem ? gemOffsets.get(cell.gem.id) : undefined;
              const tutActive = Boolean(tutorialPrompt && !busy);
              const isTutFrom =
                tutActive &&
                tutorialPrompt!.from.row === r &&
                tutorialPrompt!.from.col === c;
              const isTutTo =
                tutActive &&
                tutorialPrompt!.to.row === r &&
                tutorialPrompt!.to.col === c;
              const isTutTarget = isTutFrom || isTutTo;
              const fromAlreadySelected =
                tutActive &&
                selected?.row === tutorialPrompt!.from.row &&
                selected?.col === tutorialPrompt!.from.col;
              const toAlreadySelected =
                tutActive &&
                selected?.row === tutorialPrompt!.to.row &&
                selected?.col === tutorialPrompt!.to.col;
              const pointHere = tutActive
                ? fromAlreadySelected
                  ? isTutTo
                  : toAlreadySelected
                  ? isTutFrom
                  : isTutFrom
                : false;

              return (
                <button
                  key={key}
                  type="button"
                  data-row={r}
                  data-col={c}
                  data-hint={hinted ? 'true' : undefined}
                  data-tutorial-target={isTutFrom ? 'from' : isTutTo ? 'to' : undefined}
                  aria-label={labelParts.join(', ')}
                  aria-pressed={isSelected}
                  onPointerDown={(e) => handlePointerDown({ row: r, col: c }, e)}
                  onKeyDown={(e) => handleKeyDown({ row: r, col: c }, e)}
                  onClick={() => {
                    if (swipeTriggeredRef.current) {
                      swipeTriggeredRef.current = false;
                      return;
                    }
                    onCellClick({ row: r, col: c });
                  }}
                  disabled={isHole}
                  tabIndex={isHole ? -1 : undefined}
                  aria-hidden={isHole ? true : undefined}
                  className={`group relative min-w-0 min-h-0 w-full h-full rounded-md sm:rounded-lg flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B841] touch-none ${
                    isHole
                      ? 'pointer-events-none bg-[#070A14]'
                      : `cursor-pointer shadow-[inset_0_2px_4px_rgba(0,0,0,0.65)] ${
                          checkerboardDark ? 'bg-[#22307A]' : 'bg-[#2B3B91]'
                        }`
                  } ${
                    isSelected
                      ? 'ring-2 ring-inset ring-[#F5B841] bg-[#3F52C4] z-10'
                      : isTutTarget
                      ? 'ring-2 ring-inset ring-[#FDE047] bg-[#3F52C4] z-10'
                      : hinted
                      ? 'ring-2 ring-inset ring-[#38BDF8] bg-[#182B42] z-10'
                      : activeTool
                      ? 'hover:ring-2 hover:ring-inset hover:ring-[#F5B841]/80'
                      : 'hover:bg-[#1E263A]'
                  } ${invalid ? 'animate-gem-invalid' : ''}`}
                >
                  {/* Portal: a glowing ring, one colour per pair */}
                  {cell.portal && !isHole && (
                    <div
                      aria-hidden="true"
                      data-testid="portal"
                      className="pointer-events-none absolute inset-[3%] rounded-full border-[3px] border-dashed"
                      style={{
                        borderColor: cell.portal % 2 === 1 ? '#C77DFF' : '#3CE0C8',
                        background: `radial-gradient(circle, ${
                          cell.portal % 2 === 1 ? 'rgba(199,125,255,0.55)' : 'rgba(60,224,200,0.5)'
                        } 0%, rgba(0,0,0,0) 72%)`,
                      }}
                    />
                  )}
                  {/* Conveyor belt floor: chevrons show which way it moves */}
                  {cell.belt && !isHole && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-md border-y-[3px] border-[#111111] bg-[#3A3F4B]"
                    >
                      <svg viewBox="0 0 40 40" className={`h-full w-full ${cell.belt === -1 ? '-scale-x-100' : ''}`}>
                        <path
                          d="M9 9 L20 20 L9 31 M22 9 L33 20 L22 31"
                          fill="none"
                          stroke="#F2CD1C"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.75"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Frosted 3D Ice Floor Layer */}
                  {cell.ice > 0 && (
                    <div
                      aria-hidden="true"
                      className={`pointer-events-none absolute inset-0 rounded-lg border-2 border-b-[4px] ${
                        cell.ice >= 2
                          ? 'bg-gradient-to-br from-[#BAE6FD]/45 via-[#38BDF8]/30 to-[#0284C7]/35 border-[#BAE6FD] border-b-[#0369A1]'
                          : 'bg-gradient-to-br from-[#E0F2FE]/30 via-[#38BDF8]/18 to-transparent border-[#7DD3FC]/85 border-b-[#0284C7]/80'
                      }`}
                    />
                  )}

                  {/* Crate or 3D Animal Gem Content */}
                  {isHole ? null : cell.crate > 0 ? (
                    <div
                      className={`w-full h-full p-1 transition-all duration-150 group-hover:-translate-y-0.5 ${
                        clearing ? 'animate-gem-clear' : ''
                      } ${tutActive && !isTutTarget ? 'opacity-40' : ''}`}
                    >
                      {cell.block === 'honey' ? (
                        <HoneySvg className="w-full h-full drop-shadow-[0_4px_5px_rgba(0,0,0,0.7)]" />
                      ) : (
                        <CrateSvg
                          hp={cell.crate}
                          className="w-full h-full drop-shadow-[0_4px_5px_rgba(0,0,0,0.7)]"
                        />
                      )}
                    </div>
                  ) : cell.gem ? (
                    <div
                      className={`w-full h-full transition-opacity duration-200 ${
                        tutActive && !isTutTarget ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <GemMotion
                        key={cell.gem.id}
                        dxCols={delta?.dx ?? 0}
                        dyRows={delta?.dy ?? 0}
                        durationMs={motionDurationMs}
                        clearing={clearing}
                        isSelected={isSelected}
                        hinted={hinted || isTutTarget}
                        isSpecial={cell.gem.special !== 'none'}
                      >
                        {cell.gem.egg ? (
                          <EggSvg className="relative z-10 w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.68)]" />
                        ) : (
                          <GemSvg
                            color={cell.gem.color}
                            special={cell.gem.special}
                            chained={cell.gem.chained}
                            skin={skin}
                            animationSeed={cell.gem.id}
                            className="relative z-10 w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.68)]"
                          />
                        )}
                        {cell.gem.bomb !== undefined && (
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-0 z-10 rounded-md border-[3px] ${
                              cell.gem.bomb <= 3 ? 'border-[#FF2E4D] bg-[#FF2E4D]/25' : 'border-[#FF9F1C] bg-[#FF9F1C]/15'
                            }`}
                          />
                        )}
                        {cell.gem.bomb !== undefined && (
                          <span
                            aria-hidden="true"
                            data-testid="bomb-timer"
                            className={`absolute -right-1 -top-1 z-20 grid h-[58%] w-[58%] place-items-center rounded-full border-[3px] border-[#111111] font-mono-num text-[min(4.4vw,19px)] font-extrabold leading-none ${
                              cell.gem.bomb <= 3 ? 'bg-[#FF2E4D] text-white animate-pulse' : 'bg-[#FF9F1C] text-[#111111]'
                            }`}
                          >
                            {cell.gem.bomb}
                          </span>
                        )}
                      </GemMotion>
                    </div>
                  ) : null}

                  {/* Interactive Pointing Finger Badge on Active Tutorial Target */}
                  {pointHere && (
                    <div
                      data-testid="tutorial-pointer"
                      aria-hidden="true"
                      className="pointer-events-none absolute -bottom-2 -right-2 z-30 flex items-center gap-0.5 animate-hint-pulse drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]"
                    >
                      <svg viewBox="0 0 36 36" className="w-8 h-8">
                        <path
                          d="M12 4 L12 19 L8 15 C6.5 13.5 4.2 15.2 5.4 17.2 L12.5 28.5 C14 30.8 16.5 32 19.5 32 L24.5 32 C28.5 32 31 29.2 31 24.8 L31 15.5 C31 13.8 29.6 12.6 28 12.8 C27.4 11.4 25.8 10.8 24.4 11.4 C23.7 10 22 9.5 20.6 10.2 L20.6 4.5 C20.6 2.6 19.1 1.2 17.2 1.2 C15.3 1.2 12 2.2 12 4 Z"
                          fill="#FDE047"
                          stroke="#0F1219"
                          strokeWidth="2.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })
          )}

          {/* Directional Tutorial Swap Arrow Overlay (compact across cell seam) */}
          {tutorialPrompt && !busy && (() => {
            const xFrom = (tutorialPrompt.from.col + 0.5) * 100;
            const yFrom = (tutorialPrompt.from.row + 0.5) * 100;
            const xTo = (tutorialPrompt.to.col + 0.5) * 100;
            const yTo = (tutorialPrompt.to.row + 0.5) * 100;
            const x1 = xFrom + (xTo - xFrom) * 0.28;
            const y1 = yFrom + (yTo - yFrom) * 0.28;
            const x2 = xFrom + (xTo - xFrom) * 0.72;
            const y2 = yFrom + (yTo - yFrom) * 0.72;
            return (
              <svg
                viewBox="0 0 800 800"
                className="pointer-events-none absolute inset-0 w-full h-full z-25"
                aria-hidden="true"
              >
                <defs>
                  <marker
                    id="tut-arrowhead"
                    markerWidth="5"
                    markerHeight="5"
                    refX="3.5"
                    refY="2.5"
                    orient="auto"
                  >
                    <polygon points="0,0 5,2.5 0,5" fill="#FDE047" stroke="#0F1219" strokeWidth="0.6" />
                  </marker>
                </defs>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#0F1219"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeOpacity="0.85"
                />
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#FDE047"
                  strokeWidth="6"
                  strokeLinecap="round"
                  markerEnd="url(#tut-arrowhead)"
                />
              </svg>
            );
          })()}

          {/* 60fps Particle & Beam Overlay */}
          <ParticleCanvas ref={fxRef} />
        </div>
      </div>
    </div>
  );
};
