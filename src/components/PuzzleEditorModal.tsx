import React, { useEffect, useMemo, useState } from 'react';
import {
  buildCustomPuzzleBoard,
  countCustomBoardItems,
  createStarterCustomPuzzle,
  CustomCellSpec,
  CustomGoalKind,
  CustomPuzzleSpec,
  customPuzzleUrl,
} from '../game/customPuzzle';
import { getShareUrl } from '../game/share';
import { AnimalSkinId, BOARD_SIZE, GemColor, SpecialType } from '../game/types';
import { t } from '../i18n';
import {
  ChainBadgeIcon,
  CrateSvg,
  EggSvg,
  GemSvg,
  HoneySvg,
  IceBadgeIcon,
} from './GemSvg';

interface PuzzleEditorModalProps {
  open: boolean;
  skin: AnimalSkinId;
  initialSpec?: CustomPuzzleSpec | null;
  onPlay: (spec: CustomPuzzleSpec) => void;
  onClose: () => void;
}

type BrushId =
  | 'erase'
  | 'beam_h'
  | 'beam_v'
  | 'nova'
  | 'scout'
  | 'prism'
  | 'ice'
  | 'crate'
  | 'chain'
  | 'honey'
  | 'egg'
  | 'hole'
  | `color:${GemColor}`;

const BRUSHES: Array<{ id: BrushId; labelSv: string }> = [
  { id: 'beam_h', labelSv: 'Stråle ↔' },
  { id: 'beam_v', labelSv: 'Stråle ↕' },
  { id: 'nova', labelSv: 'Nova' },
  { id: 'scout', labelSv: 'Flygare' },
  { id: 'prism', labelSv: 'Prisma' },
  { id: 'ice', labelSv: 'Is' },
  { id: 'crate', labelSv: 'Låda' },
  { id: 'chain', labelSv: 'Kedja' },
  { id: 'honey', labelSv: 'Honung' },
  { id: 'egg', labelSv: 'Ägg' },
  { id: 'hole', labelSv: 'Hål' },
  { id: 'erase', labelSv: 'Sudda' },
];

const GOAL_OPTIONS: Array<{ id: CustomGoalKind; labelSv: string }> = [
  { id: 'ice', labelSv: 'Tina is' },
  { id: 'crate', labelSv: 'Krossa lådor' },
  { id: 'chain', labelSv: 'Bryt kedjor' },
  { id: 'honey', labelSv: 'Rensa honung' },
  { id: 'egg', labelSv: 'Samla ägg' },
  { id: 'color', labelSv: 'Samla Rävar' },
];

export const PuzzleEditorModal: React.FC<PuzzleEditorModalProps> = ({
  open,
  skin,
  initialSpec,
  onPlay,
  onClose,
}) => {
  const [spec, setSpec] = useState<CustomPuzzleSpec>(() => initialSpec ?? createStarterCustomPuzzle());
  const [brush, setBrush] = useState<BrushId>('ice');
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialSpec) setSpec(initialSpec);
  }, [initialSpec, open]);

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

  const previewBoard = useMemo(() => buildCustomPuzzleBoard(spec), [spec]);
  const counts = useMemo(() => countCustomBoardItems(spec), [spec]);

  if (!open) return null;

  const paintCell = (row: number, col: number) => {
    setSpec((prev) => {
      const rest = prev.cells.filter((c) => !(c.row === row && c.col === col));
      const existing = prev.cells.find((c) => c.row === row && c.col === col);
      if (brush === 'erase') {
        return { ...prev, cells: rest };
      }

      const nextCell: CustomCellSpec = existing ? { ...existing } : { row, col };
      if (brush === 'ice') {
        nextCell.ice = nextCell.ice === 1 ? 2 : nextCell.ice === 2 ? undefined : 1;
      } else if (brush === 'crate') {
        nextCell.crate = nextCell.crate === 1 ? 2 : nextCell.crate === 2 ? undefined : 1;
        nextCell.honey = undefined;
        nextCell.hole = undefined;
        nextCell.special = undefined;
      } else if (brush === 'honey') {
        nextCell.honey = !nextCell.honey;
        nextCell.crate = undefined;
        nextCell.hole = undefined;
        nextCell.special = undefined;
      } else if (brush === 'hole') {
        nextCell.hole = !nextCell.hole;
        nextCell.crate = undefined;
        nextCell.honey = undefined;
        nextCell.special = undefined;
      } else if (brush === 'chain') {
        nextCell.chain = !nextCell.chain;
      } else if (brush === 'egg') {
        nextCell.egg = !nextCell.egg;
        nextCell.crate = undefined;
        nextCell.honey = undefined;
        nextCell.hole = undefined;
      } else if (brush.startsWith('color:')) {
        nextCell.color = brush.slice(6) as GemColor;
        nextCell.crate = undefined;
        nextCell.honey = undefined;
        nextCell.hole = undefined;
      } else {
        // Special tile
        nextCell.special = nextCell.special === brush ? undefined : (brush as SpecialType);
        nextCell.crate = undefined;
        nextCell.honey = undefined;
        nextCell.hole = undefined;
      }

      return { ...prev, cells: [...rest, nextCell] };
    });
  };

  const handleShare = async () => {
    const link = customPuzzleUrl(getShareUrl(), spec);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        setCopyNotice(t('Banlänk kopierad! Skicka den till en vän.'));
      } else {
        setCopyNotice(link);
      }
    } catch {
      setCopyNotice(t('Kunde inte kopiera länken automatiskt.'));
    }
    window.setTimeout(() => setCopyNotice(null), 3200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="puzzle-editor-title"
      data-testid="puzzle-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/75 p-2.5 sm:p-4"
    >
      <div className="ui-panel flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 pb-2">
          <h2 id="puzzle-editor-title" className="font-display text-xl sm:text-2xl">
            {t('Pusselbyggare')}
          </h2>
          <button type="button" onClick={onClose} className="ui-btn ui-btn-red px-2 py-1 text-xs">
            {t('Stäng')}
          </button>
        </div>

        <div className="grid gap-3 overflow-y-auto overscroll-contain sm:grid-cols-[1fr_240px]">
          {/* Interactive 8x8 Board Canvas */}
          <div className="flex flex-col items-center gap-2">
            <div
              data-testid="editor-grid"
              className="grid aspect-square w-full max-w-[330px] grid-cols-8 gap-0.5 rounded-lg border-[3px] border-[#111111] bg-[#1E2B66] p-1"
            >
              {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
                const row = Math.floor(idx / BOARD_SIZE);
                const col = idx % BOARD_SIZE;
                const cell = previewBoard[row][col];
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => paintCell(row, col)}
                    className={`relative aspect-square rounded-sm border border-[#111111]/40 transition-transform active:scale-95 ${
                      cell.block === 'hole'
                        ? 'bg-[#0B1024]'
                        : cell.ice > 0
                        ? 'bg-[#8AE5FF]/70'
                        : 'bg-[#2C3F91]'
                    }`}
                  >
                    {cell.ice > 0 && (
                      <span className="pointer-events-none absolute inset-0 opacity-75">
                        <IceBadgeIcon className="h-full w-full" />
                      </span>
                    )}
                    {cell.block === 'honey' ? (
                      <HoneySvg className="h-full w-full" />
                    ) : cell.crate > 0 && cell.block !== 'hole' ? (
                      <CrateSvg hp={cell.crate} className="h-full w-full" />
                    ) : cell.gem?.egg ? (
                      <EggSvg className="h-full w-full" />
                    ) : cell.gem ? (
                      <GemSvg
                        color={cell.gem.color}
                        special={cell.gem.special}
                        skin={skin}
                        animationSeed={idx}
                        className="h-full w-full"
                      />
                    ) : null}
                    {cell.gem?.chained && (
                      <span className="pointer-events-none absolute inset-0">
                        <ChainBadgeIcon className="h-full w-full" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Brush Palette */}
            <div className="grid w-full max-w-[330px] grid-cols-4 gap-1">
              {BRUSHES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBrush(b.id)}
                  className={`ui-btn px-1 py-1 text-[10px] sm:text-[11px] ${
                    brush === b.id ? 'ui-btn-yellow' : ''
                  }`}
                >
                  {t(b.labelSv)}
                </button>
              ))}
            </div>
          </div>

          {/* Right Settings Column */}
          <div className="space-y-2.5">
            <div className="ui-inset space-y-1.5 p-2.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                {t('Bannamn')}
              </label>
              <input
                type="text"
                maxLength={32}
                value={spec.heading}
                onChange={(e) => setSpec((p) => ({ ...p, heading: e.target.value }))}
                className="w-full rounded border-2 border-[#111111] bg-white px-2 py-1 text-xs font-bold"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                    {t('Drag')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={spec.moves}
                    onChange={(e) =>
                      setSpec((p) => ({
                        ...p,
                        moves: Math.max(1, Math.min(15, Number(e.target.value) || 3)),
                      }))
                    }
                    className="w-full rounded border-2 border-[#111111] bg-white px-2 py-1 font-mono-num text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                    {t('Antal mål')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={spec.goalTarget}
                    onChange={(e) =>
                      setSpec((p) => ({
                        ...p,
                        goalTarget: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-full rounded border-2 border-[#111111] bg-white px-2 py-1 font-mono-num text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#4B4B4B]">
                  {t('Måltyp')}
                </label>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {GOAL_OPTIONS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        setSpec((p) => ({
                          ...p,
                          goalKind: g.id,
                          goalColor: g.id === 'color' ? 'ruby' : undefined,
                          goalTarget: Math.max(1, counts[g.id] || p.goalTarget),
                        }))
                      }
                      className={`ui-btn px-1.5 py-1 text-[10px] ${
                        spec.goalKind === g.id ? 'ui-btn-yellow' : ''
                      }`}
                    >
                      {t(g.labelSv)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                data-testid="editor-play-btn"
                onClick={() => onPlay(spec)}
                className="ui-btn ui-btn-green w-full px-3 py-2 font-display text-lg tracking-wide"
              >
                {t('Testspela bana')}
              </button>
              <button
                type="button"
                data-testid="editor-share-btn"
                onClick={() => void handleShare()}
                className="ui-btn ui-btn-yellow w-full px-3 py-1.5 text-xs"
              >
                {t('Kopiera delningslänk')}
              </button>
              <button
                type="button"
                onClick={() => setSpec(createStarterCustomPuzzle())}
                className="ui-btn w-full px-3 py-1 text-xs"
              >
                {t('Återställ mall')}
              </button>
            </div>

            {copyNotice && (
              <div role="status" className="text-center text-[11px] font-extrabold text-[#0B6B2B]">
                {copyNotice}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
