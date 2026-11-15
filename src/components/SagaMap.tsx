import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatNumber, t } from '../i18n';
import {
  CAMPAIGN_CHAPTER_COUNT,
  LEVELS_PER_CHAPTER,
  chapterCrew,
  chapterOfLevelIdx,
  getChapter,
} from '../game/levels';
import { GemSvg } from './GemSvg';
import { UiIcon } from './UiIcon';

interface SagaMapProps {
  highestUnlockedIdx: number;
  selectedLevelIdx: number;
  /** Best star count per level id. */
  bestStars: Record<number, number>;
  onSelectLevel: (idx: number) => void;
  /** Called while scrolling with the chapter in the middle of the view. */
  onChapterInView: (chapterId: number) => void;
}

// Geometry of one chapter on the trail, in CSS pixels.
const HEAD = 44;
const STEP = 60;
const CHAPTER_HEIGHT = HEAD + LEVELS_PER_CHAPTER * STEP;

/** Horizontal position of a level on the winding trail, in percent. */
function trailX(levelIdx: number): number {
  return 50 + 33 * Math.sin(levelIdx * 0.82);
}

function nodeY(pos: number): number {
  return HEAD + pos * STEP + STEP / 2;
}

const TinyStars: React.FC<{ stars: number }> = ({ stars }) => (
  <span aria-hidden="true" className="absolute left-1/2 top-full mt-px flex -translate-x-1/2 gap-px">
    {[1, 2, 3].map((n) => (
      <svg key={n} viewBox="0 0 24 24" className="h-2.5 w-2.5">
        <polygon
          points="12,2.4 15.1,8.9 22.2,9.8 17,14.7 18.3,21.7 12,18.3 5.7,21.7 7,14.7 1.8,9.8 8.9,8.9"
          fill={n <= stars ? '#FFC61A' : '#FFFFFF'}
          stroke="#111111"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
    ))}
  </span>
);

/** The island a level sits on. `kind` varies what grows on it. */
const Island: React.FC<{ big: boolean; locked: boolean; kind: number }> = ({ big, locked, kind }) => {
  const sand = locked ? '#B9C2CC' : '#F1D58A';
  const green = locked ? '#8E9AA6' : '#4FAE5A';
  const trunk = locked ? '#6F7780' : '#7A4B12';
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 80"
      className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[46%] overflow-visible ${
        big ? 'h-[5.6rem] w-[7rem]' : 'h-[4.5rem] w-[5.6rem]'
      }`}
    >
      {/* Shallow water around the shore */}
      <ellipse cx="50" cy="50" rx="48" ry="27" fill="#7FD6F7" opacity="0.55" />
      <path
        d="M8 50 C8 34 26 26 50 26 C76 26 92 35 92 50 C92 65 74 72 50 72 C24 72 8 64 8 50 Z"
        fill={sand}
        stroke="#111111"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {kind === 0 && (
        <g transform="translate(80 40)">
          <path d="M0 6 q4 -14 -1 -26" fill="none" stroke="#111111" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M0 6 q4 -14 -1 -26" fill="none" stroke={trunk} strokeWidth="3.5" strokeLinecap="round" />
          <path
            d="M-1 -20 q-13 -8 -21 2 q11 -2 21 -2 q12 -10 23 0 q-13 -2 -23 0 q2 -12 -6 -17 q10 3 6 17 Z"
            fill={green}
            stroke="#111111"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
        </g>
      )}
      {kind === 1 && (
        <g stroke="#111111" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M12 46 a7 7 0 0 1 12 -4 a6 6 0 0 1 9 5 Z" fill={green} />
          <path d="M78 58 l5 -6 l7 2 l1 6 Z" fill="#9AA3AD" />
        </g>
      )}
      {kind === 2 && (
        <g stroke="#111111" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M14 56 l4 -8 l8 1 l3 7 Z" fill="#9AA3AD" />
          <path d="M76 44 a6 6 0 0 1 11 -3 a5 5 0 0 1 6 5 Z" fill={green} />
        </g>
      )}
    </svg>
  );
};

/**
 * The saga as one long winding trail. Only the chapters near the visible
 * part are rendered, so thousands of chapters cost nothing.
 */
export const SagaMap: React.FC<SagaMapProps> = ({
  highestUnlockedIdx,
  selectedLevelIdx,
  bestStars,
  onSelectLevel,
  onChapterInView,
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewHeight, setViewHeight] = useState(280);
  const mountedRef = useRef(false);
  const reportedRef = useRef(0);

  const latestChapter = chapterOfLevelIdx(highestUnlockedIdx);
  // The next chapter is shown locked, as a teaser.
  const chapterTotal = Math.min(CAMPAIGN_CHAPTER_COUNT, latestChapter + 1);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setViewHeight(el.clientHeight || 280);
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(el);
    return () => observer?.disconnect();
  }, []);

  // Bring the selected level into view: instantly on mount, smoothly afterwards.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const chapterIdx = Math.floor(selectedLevelIdx / LEVELS_PER_CHAPTER);
    const y = chapterIdx * CHAPTER_HEIGHT + nodeY(selectedLevelIdx % LEVELS_PER_CHAPTER);
    const top = Math.max(0, y - el.clientHeight / 2);
    const visible = y > el.scrollTop + 40 && y < el.scrollTop + el.clientHeight - 40;
    if (!mountedRef.current) {
      mountedRef.current = true;
      el.scrollTop = top;
      setScrollTop(el.scrollTop);
    } else if (!visible) {
      // Far jumps (chapter pager) go straight there; near ones glide.
      const far = Math.abs(top - el.scrollTop) > CHAPTER_HEIGHT * 2;
      el.scrollTo({ top, behavior: far ? 'auto' : 'smooth' });
    }
  }, [selectedLevelIdx]);

  useEffect(() => {
    const middle = scrollTop + viewHeight / 2;
    const chapterId = Math.min(chapterTotal, Math.max(1, Math.floor(middle / CHAPTER_HEIGHT) + 1));
    if (chapterId !== reportedRef.current) {
      reportedRef.current = chapterId;
      onChapterInView(chapterId);
    }
  }, [scrollTop, viewHeight, chapterTotal, onChapterInView]);

  const first = Math.max(0, Math.floor(scrollTop / CHAPTER_HEIGHT) - 1);
  const last = Math.min(chapterTotal - 1, Math.floor((scrollTop + viewHeight) / CHAPTER_HEIGHT) + 1);
  const visibleChapters = useMemo(() => {
    const list: number[] = [];
    for (let i = first; i <= last; i++) list.push(i);
    return list;
  }, [first, last]);

  return (
    <div
      ref={scrollerRef}
      data-testid="saga-map"
      role="group"
      aria-label={t('Välj nivå')}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
      className="ui-saga relative h-[17.5rem] sm:h-[19rem] overflow-y-auto overscroll-contain rounded-sm border-[3px] border-[#111111]"
    >
      <div className="relative" style={{ height: chapterTotal * CHAPTER_HEIGHT + 24 }}>
        {visibleChapters.map((chapterIdx) => {
          const chapterId = chapterIdx + 1;
          const firstIdx = chapterIdx * LEVELS_PER_CHAPTER;
          const crew = chapterCrew(chapterId);
          const chapterLocked = firstIdx > highestUnlockedIdx;
          // Trail through this chapter and on to the first level of the next one.
          const points: string[] = [];
          for (let pos = 0; pos <= LEVELS_PER_CHAPTER; pos++) {
            if (pos === LEVELS_PER_CHAPTER && chapterId >= chapterTotal) break;
            const y = pos === LEVELS_PER_CHAPTER ? CHAPTER_HEIGHT + nodeY(0) : nodeY(pos);
            points.push(`${trailX(firstIdx + pos).toFixed(2)},${y}`);
          }
          return (
            <section
              key={chapterId}
              aria-label={t('Kapitel {n}', { n: formatNumber(chapterId) })}
              className="absolute inset-x-0"
              style={{ top: chapterIdx * CHAPTER_HEIGHT, height: CHAPTER_HEIGHT }}
            >
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
                viewBox={`0 0 100 ${CHAPTER_HEIGHT}`}
                preserveAspectRatio="none"
              >
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke="#0E5A9C"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
                <polyline
                  points={points.join(' ')}
                  fill="none"
                  stroke={chapterLocked ? '#8FC3E6' : '#FFFFFF'}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="7 9"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              <div
                className={`absolute left-1/2 top-1.5 flex max-w-[92%] -translate-x-1/2 items-center gap-1.5 border-[3px] border-[#111111] px-2 py-0.5 shadow-[3px_3px_0_#111111] ${
                  chapterLocked ? 'bg-[#AEB3BB] text-[#4B4B4B]' : 'bg-[#F2CD1C] text-[#111111]'
                }`}
              >
                <span className="font-mono-num text-[10px] font-extrabold">{formatNumber(chapterId)}</span>
                <span className="truncate font-display text-sm leading-tight tracking-wide">
                  {t(getChapter(chapterId).nameSv)}
                </span>
                {chapterLocked && <UiIcon name="locked" className="h-3 w-3 shrink-0" />}
              </div>

              {/* Two of the chapter's animals keep the trail company */}
              {[2, 5].map((pos, i) => (
                <span
                  key={pos}
                  aria-hidden="true"
                  className={`pointer-events-none absolute h-9 w-9 ${chapterLocked ? 'opacity-40 grayscale' : ''}`}
                  style={{
                    top: nodeY(pos) - 18,
                    left: `${trailX(firstIdx + pos) > 50 ? 9 + i * 7 : 78 - i * 7}%`,
                  }}
                >
                  <GemSvg color={crew[i]} special="none" animationSeed={chapterId * 7 + i} />
                </span>
              ))}

              {Array.from({ length: LEVELS_PER_CHAPTER }, (_, pos) => {
                const idx = firstIdx + pos;
                const id = idx + 1;
                const locked = idx > highestUnlockedIdx;
                const active = idx === selectedLevelIdx;
                const frontier = idx === highestUnlockedIdx;
                const finale = pos === LEVELS_PER_CHAPTER - 1;
                const stars = bestStars[id] ?? 0;
                return (
                  <div
                    key={id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: nodeY(pos), left: `${trailX(idx)}%` }}
                  >
                    <Island big={finale} locked={locked} kind={idx % 3} />
                    <button
                      type="button"
                      disabled={locked}
                      data-level-node={id}
                      onClick={() => onSelectLevel(idx)}
                      aria-label={`${t('Nivå {n}', { n: id })}${locked ? ` ${t('(låst)')}` : ''}${
                        stars ? `, ${t('{n} av 3 stjärnor', { n: stars })}` : ''
                      }`}
                      aria-pressed={active}
                      className={`ui-node relative font-mono-num font-extrabold ${
                        finale ? 'h-12 w-12' : 'h-10 w-10'
                      } ${id > 9999 ? 'text-[9px]' : id > 999 ? 'text-[10px]' : 'text-sm'} ${
                        active
                          ? 'ui-node-active scale-110'
                          : locked
                          ? 'ui-node-locked'
                          : finale
                          ? 'ui-node-finale'
                          : ''
                      }`}
                    >
                      {locked ? <UiIcon name="locked" className="h-3.5 w-3.5" /> : id}
                      {!locked && <TinyStars stars={stars} />}
                    </button>
                    {frontier && (
                      <span
                        aria-hidden="true"
                        data-testid="saga-marker"
                        className="pointer-events-none absolute -top-7 left-1/2 h-8 w-8 -translate-x-1/2 animate-menu-bob"
                      >
                        <GemSvg color={crew[0]} special="none" animationSeed={3} />
                      </span>
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
};
