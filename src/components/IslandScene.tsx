import React from 'react';
import { BUILDINGS, BuildingId } from '../game/island';
import { AnimalSkinId } from '../game/types';
import { GemSvg } from './GemSvg';

/** Where each building's resident stands (top-left corner of a 26 px animal). */
const HOME: Record<BuildingId, [number, number]> = {
  fire: [166, 138],
  tent: [62, 142],
  garden: [226, 132],
  hut: [182, 108],
  dock: [262, 124],
  well: [124, 96],
  boat: [284, 104],
  treehouse: [70, 112],
  mill: [228, 104],
  lighthouse: [36, 146],
  tower: [262, 94],
  statue: [132, 60],
};

const S = { stroke: '#111111', strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** One drawing per building, each placed on its own spot of the island. */
const ART: Record<BuildingId, React.ReactNode> = {
  fire: (
    <g transform="translate(150 150)">
      <path d="M-12 8 L12 2 M-12 2 L12 8" stroke="#7A4B12" strokeWidth="5" strokeLinecap="round" />
      <path d="M0 -18 C8 -8 10 -2 6 4 C3 8 -3 8 -6 4 C-10 -2 -6 -8 0 -18 Z" fill="#FF7A1A" {...S} />
      <path d="M0 -7 C3 -3 4 0 2 3 C0 5 -3 4 -3 1 C-3 -2 -2 -4 0 -7 Z" fill="#F2CD1C" />
    </g>
  ),
  tent: (
    <g transform="translate(96 140)">
      <path d="M0 -26 L24 12 H-24 Z" fill="#FF2E4D" {...S} />
      <path d="M0 -26 L7 12 H-7 Z" fill="#7A1E10" {...S} />
    </g>
  ),
  garden: (
    <g transform="translate(206 156)">
      <rect x="-22" y="-6" width="44" height="16" rx="3" fill="#8A5A2B" {...S} />
      {[-14, 0, 14].map((x) => (
        <g key={x} transform={`translate(${x} -6)`}>
          <path d="M0 0 L-4 -9 M0 0 L0 -11 M0 0 L4 -9" stroke="#2F8F3A" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M-3 0 H3 L0 8 Z" fill="#FF7A1A" stroke="#111111" strokeWidth="1.4" />
        </g>
      ))}
    </g>
  ),
  hut: (
    <g transform="translate(160 106)">
      <rect x="-20" y="-6" width="40" height="28" fill="#F1D58A" {...S} />
      <path d="M-27 -6 L0 -30 L27 -6 Z" fill="#D4002A" {...S} />
      <rect x="-6" y="6" width="12" height="16" fill="#7A4B12" {...S} />
      <rect x="9" y="1" width="7" height="7" fill="#7FD6F7" stroke="#111111" strokeWidth="1.6" />
    </g>
  ),
  dock: (
    <g transform="translate(262 150)">
      <path d="M-6 8 V22 M14 8 V22 M34 8 V22" stroke="#111111" strokeWidth="5" strokeLinecap="round" />
      <path d="M-6 8 V22 M14 8 V22 M34 8 V22" stroke="#7A4B12" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-14" y="0" width="56" height="9" rx="2" fill="#C9955A" {...S} />
    </g>
  ),
  well: (
    <g transform="translate(110 104)">
      <path d="M-13 -22 H13 L9 -30 H-9 Z" fill="#D4002A" {...S} />
      <path d="M-10 -22 V0 M10 -22 V0" stroke="#111111" strokeWidth="3" />
      <rect x="-13" y="-2" width="26" height="15" rx="3" fill="#B9C2CC" {...S} />
      <path d="M-13 5 H13" stroke="#111111" strokeWidth="1.6" />
    </g>
  ),
  boat: (
    <g transform="translate(296 126)">
      <path d="M0 6 V-34" stroke="#111111" strokeWidth="3" />
      <path d="M2 -32 L22 0 H2 Z" fill="#FFFFFF" {...S} />
      <path d="M-2 -26 L-16 0 H-2 Z" fill="#F2CD1C" {...S} />
      <path d="M-22 4 H26 L18 16 H-14 Z" fill="#FF2E4D" {...S} />
    </g>
  ),
  treehouse: (
    <g transform="translate(58 104)">
      <path d="M0 40 V-6" stroke="#111111" strokeWidth="11" strokeLinecap="round" />
      <path d="M0 40 V-6" stroke="#7A4B12" strokeWidth="6.5" strokeLinecap="round" />
      <path d="M-26 -8 C-30 -26 -14 -38 0 -36 C16 -40 30 -26 26 -8 C22 4 -22 4 -26 -8 Z" fill="#3FA34D" {...S} />
      <rect x="-13" y="-8" width="26" height="18" fill="#C9955A" {...S} />
      <path d="M-17 -8 L0 -20 L17 -8 Z" fill="#8A5A2B" {...S} />
      <rect x="-4" y="-2" width="8" height="8" fill="#FDE047" stroke="#111111" strokeWidth="1.6" />
    </g>
  ),
  mill: (
    <g transform="translate(214 92)">
      <path d="M-13 30 L-8 -8 H8 L13 30 Z" fill="#FFFFFF" {...S} />
      <path d="M-10 -8 L0 -20 L10 -8 Z" fill="#27B8FF" {...S} />
      <g className="ui-island-spin" style={{ transformOrigin: '0px -8px' }}>
        <path d="M0 -8 L-24 -24 M0 -8 L24 8 M0 -8 L16 -32 M0 -8 L-16 16" stroke="#111111" strokeWidth="6" strokeLinecap="round" />
        <path d="M0 -8 L-24 -24 M0 -8 L24 8 M0 -8 L16 -32 M0 -8 L-16 16" stroke="#F2CD1C" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="0" cy="-8" r="3" fill="#111111" />
    </g>
  ),
  lighthouse: (
    <g transform="translate(26 132)">
      <path d="M-10 30 L-6 -20 H6 L10 30 Z" fill="#FFFFFF" {...S} />
      <path d="M-8.5 8 H8.5 L7.6 -4 H-7.6 Z" fill="#FF2E4D" />
      <rect x="-8" y="-32" width="16" height="12" fill="#FDE047" {...S} />
      <path d="M-11 -32 L0 -42 L11 -32 Z" fill="#D4002A" {...S} />
      <path d="M10 -27 L34 -36 V-18 Z" fill="#FDE047" opacity="0.55" />
    </g>
  ),
  tower: (
    <g transform="translate(252 86)">
      <path d="M-10 36 L-6 -10 M10 36 L6 -10 M-8 14 L8 2 M8 14 L-8 2" stroke="#111111" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M-10 36 L-6 -10 M10 36 L6 -10 M-8 14 L8 2 M8 14 L-8 2" stroke="#C9955A" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="-13" y="-22" width="26" height="13" fill="#C9955A" {...S} />
      <path d="M-17 -22 L0 -34 L17 -22 Z" fill="#3FA34D" {...S} />
      <path d="M0 -34 V-46 L12 -41 L0 -37" fill="#FF2E4D" {...S} strokeWidth={1.8} />
    </g>
  ),
  statue: (
    <g transform="translate(160 62)">
      <rect x="-14" y="8" width="28" height="9" fill="#B9C2CC" {...S} />
      <path d="M-11 8 C-13 -6 -8 -16 0 -16 C8 -16 13 -6 11 8 Z" fill="#F2CD1C" {...S} />
      <path d="M-9 -12 L-13 -24 L-3 -17 Z M9 -12 L13 -24 L3 -17 Z" fill="#F2CD1C" {...S} />
      <circle cx="-4" cy="-6" r="1.5" fill="#111111" />
      <circle cx="4" cy="-6" r="1.5" fill="#111111" />
      <path d="M-3 0 Q0 3 3 0" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 -22 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill="#FFFFFF" stroke="#111111" strokeWidth="1.4" />
    </g>
  ),
};

/** The player's island with the first `built` buildings standing. */
export const IslandScene: React.FC<{ built: number; skin?: AnimalSkinId; className?: string }> = ({
  built,
  skin = 'classic',
  className = '',
}) => (
  <svg viewBox="0 0 320 200" className={className} role="img" aria-hidden="true">
    <rect width="320" height="200" fill="#2FAAE4" />
    <path
      d="M0 34 q10 -7 20 0 t20 0 t20 0 M210 22 q10 -7 20 0 t20 0 M250 186 q10 -7 20 0 t20 0 M6 190 q10 -7 20 0 t20 0"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="3"
      strokeLinecap="round"
      opacity="0.7"
    />
    <ellipse cx="156" cy="132" rx="150" ry="64" fill="#7FD6F7" opacity="0.6" />
    <path
      d="M14 134 C14 94 70 70 156 70 C246 70 300 96 300 134 C300 168 240 184 156 184 C70 184 14 170 14 134 Z"
      fill="#F1D58A"
      stroke="#111111"
      strokeWidth="3"
    />
    <path
      d="M52 126 C52 100 96 84 156 84 C220 84 262 102 262 126 C262 148 216 160 156 160 C96 160 52 148 52 126 Z"
      fill="#7BC96F"
      stroke="#111111"
      strokeWidth="2.4"
    />
    {BUILDINGS.map((building, i) =>
      i < built ? (
        <g key={building.id} data-building={building.id}>
          {ART[building.id]}
        </g>
      ) : null
    )}
    {/* The animals that have moved in stroll about next to their homes */}
    {BUILDINGS.map((building, i) =>
      i < built ? (
        <svg
          key={`resident-${building.id}`}
          data-resident={building.resident}
          x={HOME[building.id][0]}
          y={HOME[building.id][1]}
          width="26"
          height="26"
          viewBox="0 0 64 64"
          overflow="visible"
        >
          <g className="ui-island-stroll" style={{ animationDelay: `${-i * 0.7}s` }}>
            <GemSvg color={building.resident} special="none" skin={skin} animationSeed={i * 5 + 1} />
          </g>
        </svg>
      ) : null
    )}
  </svg>
);
