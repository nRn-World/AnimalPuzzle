import React, { useEffect, useState } from 'react';
import { t } from '../i18n';
import {
  ChainBadgeIcon,
  CrateSvg,
  EggSvg,
  HoneySvg,
  GemSvg,
  HammerIcon,
  IceBadgeIcon,
  PulseIcon,
  ShuffleIcon,
} from './GemSvg';
import { StarRating } from './StarRating';
import { UiIcon } from './UiIcon';

interface GuidePage {
  eyebrow: string;
  title: string;
  text: string;
  tip: string;
  /** A function so translated labels follow the current language. */
  visual: () => React.ReactNode;
}

const IconTile: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'w-14 h-14 sm:w-16 sm:h-16',
}) => (
  <div
    className={`${className} rounded-2xl bg-gradient-to-b from-white/10 to-black/40 border border-white/15 border-b-[3px] border-b-black/60 text-[#E2E8F0] flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.45)]`}
  >
    {children}
  </div>
);

const PAGES: GuidePage[] = [
  {
    eyebrow: 'Grunden',
    title: 'Matcha 3 djur',
    text:
      'Byt plats på två djur som ligger bredvid varandra. Får du tre lika i rad försvinner de och nya djur faller ner.',
    tip: 'Bästa draget: leta efter par som redan står två och två.',
    visual: () => (
      <div className="flex items-center gap-2 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <IconTile key={i} className="w-14 h-14 sm:w-16 sm:h-16">
            <GemSvg color="ruby" special="none" animationSeed={i * 43 + 3} className="w-11 h-11" />
          </IconTile>
        ))}
      </div>
    ),
  },
  {
    eyebrow: '4 i rad',
    title: 'Strålen',
    text:
      'Fyra lika i rad blir en Stråle. Matcha den för att rensa hela raden eller kolumnen den står i.',
    tip: 'Bästa draget: fyra på rad ger dig en hel rad gratis.',
    visual: () => (
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-x-4 h-6 rounded-full bg-[#FDE047]/30 blur-lg" />
        <IconTile className="relative w-20 h-20 sm:w-24 sm:h-24">
          <GemSvg color="amber" special="beam_h" animationSeed={5} className="w-16 h-16 sm:w-[76px] sm:h-[76px]" />
        </IconTile>
      </div>
    ),
  },
  {
    eyebrow: 'L- eller T-form',
    title: 'Novan',
    text:
      'Fem djur i L- eller T-form blir en Nova. Den spränger allt i en 3×3-ruta runt omkring sig.',
    tip: 'Bästa draget: en Nova städar undan ett helt hörn.',
    visual: () => (
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full bg-[#F5B841]/25 blur-xl" />
        <IconTile className="relative w-20 h-20 sm:w-24 sm:h-24">
          <GemSvg color="ruby" special="nova" animationSeed={9} className="w-16 h-16 sm:w-[76px] sm:h-[76px]" />
        </IconTile>
      </div>
    ),
  },
  {
    eyebrow: 'Fyrkant 2×2',
    title: 'Flygaren',
    text:
      'Fyra lika djur i en fyrkant blir en Flygare. När den matchas flyger den till en låda, en kedja eller en isruta och slår till där.',
    tip: 'Bästa draget: byt en Flygare mot en Stråle eller Nova så bär den kraften dit den behövs.',
    visual: () => (
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full bg-[#7DD3FC]/25 blur-xl" />
        <IconTile className="relative w-20 h-20 sm:w-24 sm:h-24">
          <GemSvg color="cobalt" special="scout" animationSeed={11} className="w-16 h-16 sm:w-[76px] sm:h-[76px]" />
        </IconTile>
      </div>
    ),
  },
  {
    eyebrow: '5 i rad',
    title: 'Kromaprismat',
    text:
      'Fem lika i rad blir ett Kromaprism. Matcha det för att rensa alla djur av samma sort på hela brädet.',
    tip: 'Bästa draget: prismat är starkast när brädet är fullt av samma färg.',
    visual: () => (
      <div className="relative flex items-center justify-center">
        <div className="absolute h-24 w-24 rounded-full bg-[#A855F7]/30 blur-xl" />
        <IconTile className="relative w-20 h-20 sm:w-24 sm:h-24">
          <GemSvg color="amethyst" special="prism" animationSeed={13} className="w-16 h-16 sm:w-[76px] sm:h-[76px]" />
        </IconTile>
      </div>
    ),
  },
  {
    eyebrow: 'Kaskader',
    title: 'Kedjor laddar verktygen',
    text:
      'När nya djur faller ner och matchar igen blir det en kaskad – extra poäng och energi till dina verktyg.',
    tip: 'Bästa draget: planera bytet längst ner för långa kedjor.',
    visual: () => (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {[
            { key: 'hammer', icon: <HammerIcon className="w-6 h-6" />, label: 'Hammare' },
            { key: 'pulse', icon: <PulseIcon className="w-6 h-6" />, label: 'Korspuls' },
            { key: 'shuffle', icon: <ShuffleIcon className="w-6 h-6" />, label: 'Blanda' },
          ].map((tool) => (
            <IconTile key={tool.key} className="w-14 h-14">
              {tool.icon}
            </IconTile>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#FDE047]">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-[#22293A]">
            <span className="block h-full w-2/3 rounded-full bg-[#F5B841]" />
          </span>
          {t('+energi')}
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Mästerskap',
    title: 'Kombon, stjärnor & Skördefest',
    text:
      'Byt två specialdjur mot varandra för egna kombon som Korsstråle, Supernova och Prismstorm – de ger extra poäng. Klara nivån effektivt för stjärnor: 2★ vid 15 % drag kvar och 3★ vid 30 %.',
    tip: 'Spara ett specialdjur till slutet – i Skördefesten ger varje kvarvarande specialdjur 150 extra poäng.',
    visual: () => (
      <div className="flex flex-col items-center gap-2">
        <StarRating stars={3} size="md" />
        <div className="flex items-center gap-1.5 rounded-full border border-[#F5B841]/30 bg-[#F5B841]/10 px-2.5 py-1 text-[10px] font-bold text-[#FDE047]">
          <span>{t('Korsstråle')}</span>
          <span className="text-white/35">·</span>
          <span>{t('Prismstorm')}</span>
        </div>
      </div>
    ),
  },
  {
    eyebrow: 'Senare nivåer',
    title: 'Hinder du möter',
    text:
      'Is tinas av matchningar på rutan, trälådor spräcks av matchningar intill och kedjor lossar när djuret matchas. Längre fram kommer hål i brädet, honung som sprider sig varje drag du inte rensar någon, och ägg som ska lotsas ner till botten.',
    tip: 'Tips: matcha bredvid hindren – inte bara på dem.',
    visual: () => (
      <div className="flex items-center gap-2 sm:gap-3">
        {[
          { key: 'ice', icon: <IceBadgeIcon className="w-8 h-8" />, label: 'Is' },
          { key: 'crate', icon: <CrateSvg hp={2} className="w-8 h-8" />, label: 'Låda' },
          { key: 'chain', icon: <ChainBadgeIcon className="w-8 h-8" />, label: 'Kedja' },
          { key: 'honey', icon: <HoneySvg className="w-8 h-8" />, label: 'Honung' },
          { key: 'egg', icon: <EggSvg className="w-8 h-8" />, label: 'Ägg' },
        ].map((item) => (
          <div key={item.key} className="flex flex-col items-center gap-1">
            <IconTile className="w-11 h-11 sm:w-14 sm:h-14">{item.icon}</IconTile>
            <span className="text-[10px] font-semibold text-[#CBD5E1]">{t(item.label)}</span>
          </div>
        ))}
      </div>
    ),
  },
];

interface HowToPlayGuideProps {
  open: boolean;
  onClose: () => void;
}

export const HowToPlayGuide: React.FC<HowToPlayGuideProps> = ({ open, onClose }) => {
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (open) setPage(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setPage((p) => Math.min(PAGES.length - 1, p + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setPage((p) => Math.max(0, p - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isLast = page === PAGES.length - 1;
  const current = PAGES[page];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      data-testid="how-to-play-guide"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#111111]/70"
    >
      <div className="ui-panel w-full max-w-[540px] max-h-[88dvh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-2 sm:px-3">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">
            <UiIcon name="question" className="w-4 h-4" />
            {t('Så spelar du')}
          </div>
          <span className="rounded bg-[#111111] px-1.5 py-0.5 font-mono-num text-[10px] font-bold text-[#FFFFFF]">
            {page + 1}/{PAGES.length}
          </span>
        </div>

        <div className="px-2 sm:px-3 pb-1 pt-2.5">
          <div
            key={page}
            className="animate-menu-pop relative flex h-32 sm:h-36 items-center justify-center overflow-hidden rounded border-[3px] border-[#111111] bg-[radial-gradient(circle_at_50%_20%,rgba(245,184,65,0.16),rgba(8,12,20,0.9)_70%)]"
          >
            {current.visual()}
          </div>

          <div key={`text-${page}`} className="animate-menu-pop mt-3">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#D4002A]">
              {t(current.eyebrow)}
            </div>
            <h2
              id="how-to-play-title"
              className="font-display text-xl sm:text-2xl font-extrabold leading-tight"
            >
              {t(current.title)}
            </h2>
            <p className="mt-1 text-[13px] sm:text-sm font-medium leading-snug text-[#333333]">{t(current.text)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded border-2 border-[#111111] bg-[#F2D23C] px-2 py-1 text-[11px] sm:text-xs font-bold text-[#111111]">
              <UiIcon name="star" className="w-3 h-3 shrink-0" />
              {t(current.tip)}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] sm:text-xs font-bold text-[#4B4B4B] hover:text-[#111111] underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t('Hoppa över')}
            </button>

            <div className="flex items-center gap-1" aria-hidden="true">
              {PAGES.map((p, i) => (
                <span
                  key={p.eyebrow + i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === page ? 'w-5 bg-[#FF2E4D]' : 'w-1.5 bg-[#111111]'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {page > 0 && (
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="ui-btn px-2 py-1 text-xs"
                >
                  {t('Tillbaka')}
                </button>
              )}
              <button
                type="button"
                onClick={() => (isLast ? onClose() : setPage((p) => p + 1))}
                className="ui-btn ui-btn-green px-3 py-0.5 text-sm"
              >
                {isLast ? t('Kör igång!') : t('Nästa')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
