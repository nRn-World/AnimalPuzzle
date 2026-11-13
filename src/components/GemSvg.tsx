import React from 'react';
import { AnimalSkinId, GEM_META, GemColor, SpecialType } from '../game/types';

interface GemSvgProps {
  color: GemColor;
  special: SpecialType;
  chained?: boolean;
  skin?: AnimalSkinId;
  className?: string;
  /** Unique number that offsets the idle animations so the animals never move in sync. */
  animationSeed?: number;
}

const PetEyes: React.FC<{ seed: number; children: React.ReactNode }> = ({ seed, children }) => (
  <g
    className="pet-eyes"
    style={{
      transformBox: 'fill-box',
      transformOrigin: 'center',
      animationDelay: `${-((seed * 977) % 6800)}ms`,
      animationDuration: `${5200 + ((seed * 337) % 3800)}ms`,
    }}
  >
    {children}
  </g>
);

export const GemSvg: React.FC<GemSvgProps> = ({
  color,
  special,
  chained = false,
  skin = 'classic',
  className = 'w-full h-full',
  animationSeed = 0,
}) => {
  const palette = GEM_META[color];
  const seed = animationSeed;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {/* Special Aura Ring behind animal */}
      {special === 'nova' && (
        <circle
          cx="32"
          cy="34"
          r="27"
          fill="#F5B841"
          fillOpacity="0.18"
          stroke="#FDE047"
          strokeWidth="2.4"
          strokeDasharray="6 4"
        />
      )}

      {special === 'prism' && (
        <g>
          <circle
            cx="32"
            cy="32"
            r="27"
            fill="#1E1B3A"
            stroke="#FDE047"
            strokeWidth="2.6"
          />
          <circle cx="32" cy="32" r="22" fill="none" stroke="#EC4899" strokeWidth="2.4" strokeDasharray="10 6" />
          <polygon
            points="32,8 37,24 54,24 40,34 45,51 32,41 19,51 24,34 10,24 27,24"
            fill="#FDE047"
            stroke="#0F1219"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Cute smiling face on the Prism Star */}
          <circle cx="27.5" cy="31" r="2.2" fill="#0F1219" />
          <circle cx="36.5" cy="31" r="2.2" fill="#0F1219" />
          <circle cx="26.8" cy="30.2" r="0.8" fill="#FFFFFF" />
          <circle cx="35.8" cy="30.2" r="0.8" fill="#FFFFFF" />
          <ellipse cx="24" cy="34.5" rx="2.4" ry="1.4" fill="#FB7185" fillOpacity="0.7" />
          <ellipse cx="40" cy="34.5" rx="2.4" ry="1.4" fill="#FB7185" fillOpacity="0.7" />
          <path d="M29 35.5 Q32 38.5 35 35.5" fill="none" stroke="#0F1219" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* 1. RÄV (ruby) */}
      {special !== 'prism' && color === 'ruby' && (
        <g>
          {/* Pointed Fox Ears */}
          <polygon points="11,28 13,8 28,20" fill="#E94E65" stroke="#0F1219" strokeWidth="2.2" strokeLinejoin="round" />
          <polygon points="53,28 51,8 36,20" fill="#E94E65" stroke="#0F1219" strokeWidth="2.2" strokeLinejoin="round" />
          <polygon points="14,23 15,12 24,20" fill="#FFE4E6" />
          <polygon points="50,23 49,12 40,20" fill="#FFE4E6" />
          {/* Fox Head */}
          <path
            d="M11 33 C11 21 20 17 32 17 C44 17 53 21 53 33 C53 45 43 54 32 54 C21 54 11 45 11 33 Z"
            fill="#E94E65"
            stroke="#0F1219"
            strokeWidth="2.2"
          />
          {/* Cream Cheeks */}
          <path d="M12 36 C17 34 25 38 32 53 C20 53 12 45 12 36 Z" fill="#FFF1F2" />
          <path d="M52 36 C47 34 39 38 32 53 C44 53 52 45 52 36 Z" fill="#FFF1F2" />
          {/* Eyes & Catchlights */}
          <PetEyes seed={seed}>
            <circle cx="23.5" cy="33" r="3.4" fill="#0F1219" />
            <circle cx="40.5" cy="33" r="3.4" fill="#0F1219" />
            <circle cx="22.3" cy="31.7" r="1.3" fill="#FFFFFF" />
            <circle cx="39.3" cy="31.7" r="1.3" fill="#FFFFFF" />
          </PetEyes>
          {/* Blush */}
          <ellipse cx="18.5" cy="39" rx="3.2" ry="1.8" fill="#FB7185" fillOpacity="0.6" />
          <ellipse cx="45.5" cy="39" rx="3.2" ry="1.8" fill="#FB7185" fillOpacity="0.6" />
          {/* Cute Nose & Smile */}
          <ellipse cx="32" cy="41.5" rx="3.3" ry="2.4" fill="#0F1219" />
          <path d="M28.5 45.5 Q32 48.2 35.5 45.5" fill="none" stroke="#0F1219" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* 2. LEJON (amber) */}
      {special !== 'prism' && color === 'amber' && (
        <g>
          {/* Fluffy Scalloped Mane */}
          <path
            d="M32 6 L38 11 L46 9 L49 16 L56 19 L55 27 L59 34 L54 41 L55 49 L47 52 L43 58 L35 56 L32 60 L29 56 L21 58 L17 52 L9 49 L10 41 L5 34 L9 27 L8 19 L15 16 L18 9 L26 11 Z"
            fill="#D97706"
            stroke="#0F1219"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Round Ears */}
          <circle cx="17" cy="18" r="6" fill="#FBBF24" stroke="#0F1219" strokeWidth="2" />
          <circle cx="47" cy="18" r="6" fill="#FBBF24" stroke="#0F1219" strokeWidth="2" />
          <circle cx="17" cy="18" r="3" fill="#FEF3C7" />
          <circle cx="47" cy="18" r="3" fill="#FEF3C7" />
          {/* Sunny Lion Face */}
          <circle cx="32" cy="34" r="17" fill="#FBBF24" stroke="#0F1219" strokeWidth="2" />
          <ellipse cx="32" cy="41" rx="9.5" ry="7.2" fill="#FEF3C7" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="24.5" cy="31" r="3.2" fill="#0F1219" />
            <circle cx="39.5" cy="31" r="3.2" fill="#0F1219" />
            <circle cx="23.4" cy="29.8" r="1.2" fill="#FFFFFF" />
            <circle cx="38.4" cy="29.8" r="1.2" fill="#FFFFFF" />
          </PetEyes>
          {/* Blush */}
          <ellipse cx="19.5" cy="37" rx="3" ry="1.7" fill="#F97316" fillOpacity="0.55" />
          <ellipse cx="44.5" cy="37" rx="3" ry="1.7" fill="#F97316" fillOpacity="0.55" />
          {/* Nose & Smile */}
          <polygon points="29,37 35,37 32,41" fill="#78350F" />
          <path d="M27.5 43 Q32 46.5 36.5 43" fill="none" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* 3. GRODA (emerald) */}
      {special !== 'prism' && color === 'emerald' && (
        <g>
          {/* Big Top Frog Eye Bumps */}
          <circle cx="20" cy="19" r="9" fill="#19B87A" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="44" cy="19" r="9" fill="#19B87A" stroke="#0F1219" strokeWidth="2.2" />
          {/* Chubby Frog Face */}
          <ellipse cx="32" cy="37" rx="23" ry="18" fill="#19B87A" stroke="#0F1219" strokeWidth="2.2" />
          <ellipse cx="32" cy="43" rx="16" ry="10.5" fill="#A7F3D0" />
          {/* Big White Eyes + Shiny Pupils */}
          <PetEyes seed={seed}>
            <circle cx="20" cy="19" r="5.6" fill="#FFFFFF" stroke="#0F1219" strokeWidth="1.6" />
            <circle cx="44" cy="19" r="5.6" fill="#FFFFFF" stroke="#0F1219" strokeWidth="1.6" />
            <circle cx="20.5" cy="19" r="3" fill="#0F1219" />
            <circle cx="43.5" cy="19" r="3" fill="#0F1219" />
            <circle cx="19.5" cy="17.8" r="1.1" fill="#FFFFFF" />
            <circle cx="42.5" cy="17.8" r="1.1" fill="#FFFFFF" />
          </PetEyes>
          {/* Rosy Cheeks */}
          <ellipse cx="16.5" cy="37.5" rx="4" ry="2.2" fill="#FB7185" fillOpacity="0.65" />
          <ellipse cx="47.5" cy="37.5" rx="4" ry="2.2" fill="#FB7185" fillOpacity="0.65" />
          {/* Happy Wide Frog Smile */}
          <circle cx="28.5" cy="32" r="1.1" fill="#064E3B" />
          <circle cx="35.5" cy="32" r="1.1" fill="#064E3B" />
          <path d="M23 38.5 Q32 45.5 41 38.5" fill="none" stroke="#064E3B" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      )}

      {/* 4. PINGVIN (cobalt) */}
      {special !== 'prism' && color === 'cobalt' && (
        <g>
          {/* Flippers */}
          <ellipse cx="11" cy="38" rx="5.5" ry="10" transform="rotate(18 11 38)" fill="#2563EB" stroke="#0F1219" strokeWidth="2" />
          <ellipse cx="53" cy="38" rx="5.5" ry="10" transform="rotate(-18 53 38)" fill="#2563EB" stroke="#0F1219" strokeWidth="2" />
          {/* Chubby Penguin Body/Head */}
          <ellipse cx="32" cy="33" rx="21" ry="23" fill="#3B82F6" stroke="#0F1219" strokeWidth="2.2" />
          {/* White Heart-Shaped Face Patch */}
          <path
            d="M32 22 C25 16 15 21 15 32 C15 44 23 52 32 52 C41 52 49 44 49 32 C49 21 39 16 32 22 Z"
            fill="#F8FAFC"
          />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="24" cy="31" r="3.3" fill="#0F1219" />
            <circle cx="40" cy="31" r="3.3" fill="#0F1219" />
            <circle cx="22.8" cy="29.7" r="1.2" fill="#FFFFFF" />
            <circle cx="38.8" cy="29.7" r="1.2" fill="#FFFFFF" />
          </PetEyes>
          {/* Rosy Blush */}
          <ellipse cx="19" cy="36.5" rx="3.2" ry="1.8" fill="#FB7185" fillOpacity="0.65" />
          <ellipse cx="45" cy="36.5" rx="3.2" ry="1.8" fill="#FB7185" fillOpacity="0.65" />
          {/* Cute Orange Beak */}
          <polygon points="27,36 37,36 32,42" fill="#F59E0B" stroke="#0F1219" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      )}

      {/* 5. KANIN (amethyst) */}
      {special !== 'prism' && color === 'amethyst' && (
        <g>
          {/* Tall Cute Bunny Ears */}
          <ellipse cx="22" cy="18" rx="6.5" ry="14" transform="rotate(-10 22 18)" fill="#A855F7" stroke="#0F1219" strokeWidth="2.2" />
          <ellipse cx="42" cy="18" rx="6.5" ry="14" transform="rotate(10 42 18)" fill="#A855F7" stroke="#0F1219" strokeWidth="2.2" />
          <ellipse cx="22" cy="18" rx="3.2" ry="9" transform="rotate(-10 22 18)" fill="#FBCFE8" />
          <ellipse cx="42" cy="18" rx="3.2" ry="9" transform="rotate(10 42 18)" fill="#FBCFE8" />
          {/* Chubby Bunny Head */}
          <ellipse cx="32" cy="39" rx="21" ry="17.5" fill="#A855F7" stroke="#0F1219" strokeWidth="2.2" />
          <ellipse cx="32" cy="43.5" rx="13" ry="9.5" fill="#F3E8FF" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="23.5" cy="36" r="3.3" fill="#0F1219" />
            <circle cx="40.5" cy="36" r="3.3" fill="#0F1219" />
            <circle cx="22.4" cy="34.8" r="1.2" fill="#FFFFFF" />
            <circle cx="39.4" cy="34.8" r="1.2" fill="#FFFFFF" />
          </PetEyes>
          {/* Blush */}
          <ellipse cx="18" cy="41.5" rx="3.3" ry="1.8" fill="#F472B6" fillOpacity="0.65" />
          <ellipse cx="46" cy="41.5" rx="3.3" ry="1.8" fill="#F472B6" fillOpacity="0.65" />
          {/* Tiny Pink Nose & Bunny Mouth */}
          <ellipse cx="32" cy="41.5" rx="2.8" ry="2" fill="#EC4899" />
          <path d="M28.5 45.5 Q32 48 35.5 45.5" fill="none" stroke="#4C1D95" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* 6. ISBJÖRN (quartz) */}
      {special !== 'prism' && color === 'quartz' && (
        <g>
          {/* Round Polar Bear Ears */}
          <circle cx="16" cy="17" r="7.5" fill="#E8EFFA" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="48" cy="17" r="7.5" fill="#E8EFFA" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="16" cy="17" r="3.8" fill="#94A3B8" />
          <circle cx="48" cy="17" r="3.8" fill="#94A3B8" />
          {/* Round Bear Head */}
          <circle cx="32" cy="35" r="21" fill="#F8FAFC" stroke="#0F1219" strokeWidth="2.2" />
          {/* Snout */}
          <ellipse cx="32" cy="41.5" rx="9" ry="7" fill="#E2E8F0" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="23.5" cy="32" r="3.3" fill="#0F1219" />
            <circle cx="40.5" cy="32" r="3.3" fill="#0F1219" />
            <circle cx="22.4" cy="30.8" r="1.2" fill="#FFFFFF" />
            <circle cx="39.4" cy="30.8" r="1.2" fill="#FFFFFF" />
          </PetEyes>
          {/* Blush */}
          <ellipse cx="18" cy="38" rx="3.4" ry="1.9" fill="#FB7185" fillOpacity="0.58" />
          <ellipse cx="46" cy="38" rx="3.4" ry="1.9" fill="#FB7185" fillOpacity="0.58" />
          {/* Nose & Sweet Smile */}
          <ellipse cx="32" cy="39" rx="3.4" ry="2.4" fill="#0F1219" />
          <path d="M28.5 43.5 Q32 46.5 35.5 43.5" fill="none" stroke="#0F1219" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {/* 7. TIGER (tangerine) */}
      {special !== 'prism' && color === 'tangerine' && (
        <g>
          {/* Round Ears */}
          <circle cx="16" cy="18" r="7.5" fill="#FB923C" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="48" cy="18" r="7.5" fill="#FB923C" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="16" cy="18" r="4" fill="#FFEDD5" />
          <circle cx="48" cy="18" r="4" fill="#FFEDD5" />
          {/* Head */}
          <circle cx="32" cy="35" r="21" fill="#FB923C" stroke="#0F1219" strokeWidth="2.2" />
          {/* Forehead Stripes */}
          <path
            d="M24 16 L27 25 M32 14 L32 24 M40 16 L37 25"
            fill="none"
            stroke="#7C2D12"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          {/* Cheek Stripes */}
          <path
            d="M13 30 L20 33 M12 37 L19 38 M51 30 L44 33 M52 37 L45 38"
            fill="none"
            stroke="#7C2D12"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Muzzle */}
          <ellipse cx="32" cy="43" rx="12" ry="9" fill="#FFEDD5" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="24" cy="33" r="3.4" fill="#0F1219" />
            <circle cx="40" cy="33" r="3.4" fill="#0F1219" />
            <circle cx="22.8" cy="31.7" r="1.3" fill="#FFFFFF" />
            <circle cx="38.8" cy="31.7" r="1.3" fill="#FFFFFF" />
          </PetEyes>
          {/* Nose & Mouth */}
          <path d="M28.5 39.5 L35.5 39.5 L32 43 Z" fill="#7C2D12" />
          <path
            d="M26 46.5 Q29 49 32 46.5 Q35 49 38 46.5"
            fill="none"
            stroke="#7C2D12"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Whiskers */}
          <path
            d="M18 42 L10 41 M18 46 L10 47 M46 42 L54 41 M46 46 L54 47"
            fill="none"
            stroke="#7C2D12"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          {/* Blush */}
          <ellipse cx="18" cy="39" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.6" />
          <ellipse cx="46" cy="39" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.6" />
        </g>
      )}

      {/* 8. UGGLA (rose) */}
      {special !== 'prism' && color === 'rose' && (
        <g>
          {/* Ear Tufts */}
          <path d="M14 21 L11 6 L26 14 Z" fill="#F472B6" stroke="#0F1219" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M50 21 L53 6 L38 14 Z" fill="#F472B6" stroke="#0F1219" strokeWidth="2.2" strokeLinejoin="round" />
          {/* Head */}
          <ellipse cx="32" cy="34" rx="22" ry="21" fill="#F472B6" stroke="#0F1219" strokeWidth="2.2" />
          {/* Belly */}
          <ellipse cx="32" cy="46" rx="14" ry="9" fill="#FCE7F3" />
          {/* Big Owl Eye Discs */}
          <PetEyes seed={seed}>
            <circle cx="22" cy="31" r="9.5" fill="#FFF1F2" stroke="#0F1219" strokeWidth="1.8" />
            <circle cx="42" cy="31" r="9.5" fill="#FFF1F2" stroke="#0F1219" strokeWidth="1.8" />
            <circle cx="22" cy="31" r="4.6" fill="#0F1219" />
            <circle cx="42" cy="31" r="4.6" fill="#0F1219" />
            <circle cx="20.5" cy="29.5" r="1.6" fill="#FFFFFF" />
            <circle cx="40.5" cy="29.5" r="1.6" fill="#FFFFFF" />
          </PetEyes>
          {/* Little Feather V */}
          <path d="M30 26 Q32 28 34 26" fill="none" stroke="#BE185D" strokeWidth="1.5" strokeLinecap="round" />
          {/* Beak */}
          <polygon points="28.5,37 35.5,37 32,44" fill="#F59E0B" stroke="#0F1219" strokeWidth="1.6" strokeLinejoin="round" />
          {/* Blush */}
          <ellipse cx="13" cy="39" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.6" />
          <ellipse cx="51" cy="39" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.6" />
        </g>
      )}

      {/* 9. SKÖLDPADDA (lime) */}
      {special !== 'prism' && color === 'lime' && (
        <g>
          {/* Shell */}
          <ellipse cx="32" cy="45" rx="27" ry="16" fill="#65A30D" stroke="#0F1219" strokeWidth="2.2" />
          <path
            d="M9 44 L15 37 M55 44 L49 37 M10 50 L17 44 M54 50 L47 44 M20 57 L24 52 M44 57 L40 52"
            fill="none"
            stroke="#3F6212"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Little Flippers */}
          <ellipse cx="10" cy="51" rx="5" ry="7.5" transform="rotate(24 10 51)" fill="#84CC16" stroke="#0F1219" strokeWidth="1.8" />
          <ellipse cx="54" cy="51" rx="5" ry="7.5" transform="rotate(-24 54 51)" fill="#84CC16" stroke="#0F1219" strokeWidth="1.8" />
          {/* Head */}
          <ellipse cx="32" cy="36" rx="19" ry="16" fill="#84CC16" stroke="#0F1219" strokeWidth="2.2" />
          <ellipse cx="32" cy="43" rx="12" ry="8.5" fill="#ECFCCB" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="24" cy="33" r="3.3" fill="#0F1219" />
            <circle cx="40" cy="33" r="3.3" fill="#0F1219" />
            <circle cx="22.9" cy="31.8" r="1.2" fill="#FFFFFF" />
            <circle cx="38.9" cy="31.8" r="1.2" fill="#FFFFFF" />
          </PetEyes>
          {/* Nostrils & Smile */}
          <circle cx="29" cy="41" r="0.9" fill="#3F6212" />
          <circle cx="35" cy="41" r="0.9" fill="#3F6212" />
          <path d="M27 46 Q32 50 37 46" fill="none" stroke="#3F6212" strokeWidth="1.8" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="16.5" cy="42" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
          <ellipse cx="47.5" cy="42" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
        </g>
      )}

      {/* 10. DELFIN (sky) — uploaded artwork with matching blink frame */}
      {special !== 'prism' && color === 'sky' && (
        <g>
          <image href="/delfin-gem.png" x="0" y="0" width="64" height="64" />
          <image
            href="/delfin-gem-eyes.png"
            x="0"
            y="0"
            width="64"
            height="64"
            className="dolphin-blink-frame"
            style={{
              animationDelay: `${-((seed * 977) % 6800)}ms`,
              animationDuration: `${5200 + ((seed * 337) % 3800)}ms`,
            }}
          />
        </g>
      )}

      {/* 11. PANDA (violet) — black-and-white panda */}
      {special !== 'prism' && color === 'violet' && (
        <g>
          {/* Black Ears */}
          <circle cx="15" cy="17" r="8" fill="#111827" stroke="#0F1219" strokeWidth="2.2" />
          <circle cx="49" cy="17" r="8" fill="#111827" stroke="#0F1219" strokeWidth="2.2" />
          {/* White Head */}
          <circle cx="32" cy="35" r="21" fill="#FFFFFF" stroke="#0F1219" strokeWidth="2.2" />
          {/* Black Eye Patches */}
          <ellipse cx="23" cy="33" rx="8.5" ry="10.5" transform="rotate(-14 23 33)" fill="#111827" />
          <ellipse cx="41" cy="33" rx="8.5" ry="10.5" transform="rotate(14 41 33)" fill="#111827" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="23" cy="33" r="5" fill="#F8FAFC" />
            <circle cx="41" cy="33" r="5" fill="#F8FAFC" />
            <circle cx="23" cy="33" r="3.1" fill="#0F1219" />
            <circle cx="41" cy="33" r="3.1" fill="#0F1219" />
            <circle cx="24" cy="31.8" r="1.1" fill="#FFFFFF" />
            <circle cx="42" cy="31.8" r="1.1" fill="#FFFFFF" />
          </PetEyes>
          {/* Muzzle */}
          <ellipse cx="32" cy="44" rx="8" ry="6" fill="#F1F5F9" />
          {/* Nose & Smile */}
          <ellipse cx="32" cy="42" rx="3" ry="2.2" fill="#0F1219" />
          <path d="M28.5 46 Q32 49 35.5 46" fill="none" stroke="#0F1219" strokeWidth="1.8" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="14" cy="41" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
          <ellipse cx="50" cy="41" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
        </g>
      )}

      {/* 12. SÄL (mint) */}
      {special !== 'prism' && color === 'mint' && (
        <g>
          {/* Flippers */}
          <ellipse cx="9" cy="47" rx="6" ry="9" transform="rotate(24 9 47)" fill="#14B8A6" stroke="#0F1219" strokeWidth="2" />
          <ellipse cx="55" cy="47" rx="6" ry="9" transform="rotate(-24 55 47)" fill="#14B8A6" stroke="#0F1219" strokeWidth="2" />
          {/* Head */}
          <ellipse cx="32" cy="34" rx="21" ry="20" fill="#2DD4BF" stroke="#0F1219" strokeWidth="2.2" />
          {/* Muzzle */}
          <ellipse cx="32" cy="44" rx="11" ry="8" fill="#CCFBF1" />
          {/* Eyes */}
          <PetEyes seed={seed}>
            <circle cx="23" cy="31" r="3.6" fill="#0F1219" />
            <circle cx="41" cy="31" r="3.6" fill="#0F1219" />
            <circle cx="21.7" cy="29.6" r="1.4" fill="#FFFFFF" />
            <circle cx="39.7" cy="29.6" r="1.4" fill="#FFFFFF" />
          </PetEyes>
          {/* Nose, Whisker Dots & Smile */}
          <path d="M29 39.5 Q32 41.5 35 39.5" fill="none" stroke="#0F766E" strokeWidth="2" strokeLinecap="round" />
          <circle cx="26" cy="42" r="0.9" fill="#0F766E" />
          <circle cx="32" cy="42.5" r="0.9" fill="#0F766E" />
          <circle cx="38" cy="42" r="0.9" fill="#0F766E" />
          <path d="M27 46 Q32 50 37 46" fill="none" stroke="#0F766E" strokeWidth="1.8" strokeLinecap="round" />
          {/* Blush */}
          <ellipse cx="15" cy="37" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
          <ellipse cx="49" cy="37" rx="3" ry="1.7" fill="#FB7185" fillOpacity="0.55" />
        </g>
      )}

      {/* Exclusive Unlockable Animal Skins */}
      {special !== 'prism' && skin === 'royal' && (
        <g>
          <polygon
            points="21,16 23,5 28,11 32,3 36,11 41,5 43,16"
            fill="#FACC15"
            stroke="#0F1219"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <rect x="20.5" y="15" width="23" height="3.5" rx="1.5" fill="#EAB308" stroke="#0F1219" strokeWidth="1.4" />
          <circle cx="32" cy="11.5" r="2" fill="#E11D48" />
          <circle cx="25.5" cy="12.5" r="1.4" fill="#38BDF8" />
          <circle cx="38.5" cy="12.5" r="1.4" fill="#38BDF8" />
        </g>
      )}

      {special !== 'prism' && skin === 'winter' && (
        <g>
          <path
            d="M19 19 C19 9 25 6 32 6 C39 6 45 9 45 19 Z"
            fill="#38BDF8"
            stroke="#0F1219"
            strokeWidth="1.8"
          />
          <rect x="17.5" y="16" width="29" height="5" rx="2.5" fill="#F8FAFC" stroke="#0F1219" strokeWidth="1.6" />
          <circle cx="32" cy="5.2" r="3.6" fill="#F8FAFC" stroke="#0F1219" strokeWidth="1.5" />
          <line x1="26" y1="8" x2="26" y2="15" stroke="#BAE6FD" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="38" y1="8" x2="38" y2="15" stroke="#BAE6FD" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}

      {special !== 'prism' && skin === 'starlight' && (
        <g>
          <path d="M18 18 Q32 10 46 18" fill="none" stroke="#FDE047" strokeWidth="2.4" strokeLinecap="round" />
          <polygon
            points="32,3 34,9 40,10 35,13.5 36.5,19 32,16 27.5,19 29,13.5 24,10 30,9"
            fill="#FDE047"
            stroke="#0F1219"
            strokeWidth="1.4"
          />
          <circle cx="17" cy="18" r="2.2" fill="#E879F9" stroke="#0F1219" strokeWidth="1.2" />
          <circle cx="47" cy="18" r="2.2" fill="#38BDF8" stroke="#0F1219" strokeWidth="1.2" />
        </g>
      )}

      {/* Special Power-up Overlays (kept around edges so cute faces stay visible!) */}
      {special === 'beam_h' && (
        <g>
          <polygon points="2,32 12,24 12,40" fill="#FDE047" stroke="#0F1219" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="62,32 52,24 52,40" fill="#FDE047" stroke="#0F1219" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="12" y1="6" x2="52" y2="6" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="58" x2="52" y2="58" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {special === 'beam_v' && (
        <g>
          <polygon points="32,2 24,12 40,12" fill="#FDE047" stroke="#0F1219" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="32,62 24,52 40,52" fill="#FDE047" stroke="#0F1219" strokeWidth="1.8" strokeLinejoin="round" />
          <line x1="6" y1="12" x2="6" y2="52" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
          <line x1="58" y1="12" x2="58" y2="52" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}

      {special === 'nova' && (
        <g>
          <polygon points="10,10 13,15 18,16 14,19 15,24 10,21 5,24 6,19 2,16 7,15" fill="#FDE047" stroke="#0F1219" strokeWidth="1.2" />
          <polygon points="54,10 57,15 62,16 58,19 59,24 54,21 49,24 50,19 46,16 51,15" fill="#FDE047" stroke="#0F1219" strokeWidth="1.2" />
          <circle cx="54" cy="54" r="3" fill={palette.lightHex} stroke="#0F1219" strokeWidth="1.4" />
        </g>
      )}

      {/* Iron Chain Overlay */}
      {chained && (
        <g stroke="#0F1219" strokeWidth="1.6">
          <line x1="10" y1="14" x2="54" y2="50" stroke="#94A3B8" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="10" y1="14" x2="54" y2="50" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
          <line x1="54" y1="14" x2="10" y2="50" stroke="#94A3B8" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="54" y1="14" x2="10" y2="50" stroke="#334155" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />
          <circle cx="32" cy="32" r="7" fill="#475569" stroke="#E2E8F0" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};

export const CrateSvg: React.FC<{ hp: number; className?: string }> = ({
  hp,
  className = 'w-full h-full',
}) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <rect
      x="6"
      y="6"
      width="52"
      height="52"
      rx="9"
      fill={hp >= 2 ? '#8B5A2B' : '#6F451E'}
      stroke="#0F1219"
      strokeWidth="2.5"
    />
    <rect
      x="12"
      y="12"
      width="40"
      height="40"
      rx="5"
      fill={hp >= 2 ? '#A67241' : '#8B5A2B'}
      stroke="#4A2E14"
      strokeWidth="1.8"
    />
    <line x1="13" y1="25" x2="51" y2="25" stroke="#5C3A1B" strokeWidth="2" />
    <line x1="13" y1="39" x2="51" y2="39" stroke="#5C3A1B" strokeWidth="2" />
    <circle cx="16" cy="16" r="2" fill="#FDE68A" />
    <circle cx="48" cy="16" r="2" fill="#FDE68A" />
    <circle cx="16" cy="48" r="2" fill="#FDE68A" />
    <circle cx="48" cy="48" r="2" fill="#FDE68A" />
    {hp === 1 && (
      <path
        d="M14 14 L29 29 L24 38 L46 50 M48 16 L34 28 L39 36"
        fill="none"
        stroke="#FDE047"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    )}
  </svg>
);

export const IceBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" fill="#7DD3FC" stroke="#0F1219" strokeWidth="1.8" />
    <line x1="12" y1="5" x2="12" y2="19" stroke="#FFFFFF" strokeWidth="1.6" />
    <line x1="6" y1="9" x2="18" y2="15" stroke="#FFFFFF" strokeWidth="1.6" />
    <line x1="18" y1="9" x2="6" y2="15" stroke="#FFFFFF" strokeWidth="1.6" />
  </svg>
);

export const ChainBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M9 15 L15 9 M7 11 L5 13 C3.5 14.5 3.5 17 5 18.5 C6.5 20 9 20 10.5 18.5 L12.5 16.5 M11.5 7.5 L13.5 5.5 C15 4 17.5 4 19 5.5 C20.5 7 20.5 9.5 19 11 L17 13"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

export const HammerIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M14 4 L20 10 L16 14 L10 8 Z" fill="#F5B841" stroke="#0F1219" strokeWidth="1.6" />
    <path d="M12 10 L4 18 L6 20 L14 12" fill="#CBD5E1" stroke="#0F1219" strokeWidth="1.6" />
  </svg>
);

export const PulseIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <line x1="12" y1="2" x2="12" y2="22" stroke="#F5B841" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="2" y1="12" x2="22" y2="12" stroke="#F5B841" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4.5" fill="#FFF8DC" stroke="#0F1219" strokeWidth="1.6" />
  </svg>
);

export const ShuffleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      d="M3 7 H8 L15 17 H21 M18 4 L21 7 L18 10 M3 17 H8 L10.5 13.5 M13.5 10.5 L15 7 H21 M18 14 L21 17 L18 20"
      fill="none"
      stroke="#CBD5E1"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
