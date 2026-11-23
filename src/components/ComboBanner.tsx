import React from 'react';
import { ComboType } from '../game/types';
import { t } from '../i18n';

// Swedish source strings; translated when rendered.
const COMBO_COPY: Record<ComboType, { title: string; sub: string }> = {
  crossbeam: { title: 'KORSSTRÅLE', sub: 'Två strålar korsar hela brädet' },
  supernova: { title: 'SUPERNOVA', sub: 'Dubbel nova – ett enormt genombrott' },
  starburst: { title: 'STJÄRNFALL', sub: 'Nova och stråle i perfekt harmoni' },
  prism: { title: 'PRISMJAKT', sub: 'Hela färgen dras in i prismat' },
  prism_beam: { title: 'PRISMSTRÅLE', sub: 'Alla djur av färgen blir strålar' },
  prism_nova: { title: 'PRISMNOVA', sub: 'Alla djur av färgen exploderar' },
  prism_storm: { title: 'PRISMSTORM', sub: 'Hela brädet rensas i ett svep' },
  scout_flock: { title: 'FLOCKEN', sub: 'Tre flygare ger sig av på en gång' },
  scout_beam: { title: 'STRÅLBUD', sub: 'Flygaren bär strålen dit den behövs' },
  scout_nova: { title: 'NOVABUD', sub: 'Flygaren släpper en nova över målet' },
  prism_scout: { title: 'PRISMFLOCK', sub: 'Alla djur av färgen lyfter och slår till' },
};

export const ComboBanner: React.FC<{ type: ComboType }> = ({ type }) => (
  <div
    data-testid="combo-banner"
    role="status"
    className="pointer-events-none absolute inset-x-0 top-2 z-40 flex justify-center px-3"
  >
    <div
      className={`animate-combo-banner ui-banner px-2 pt-2.5 pb-3 text-center${
        type === 'prism_storm' ? ' prism-storm' : ''
      }`}
    >
      <div className="font-display text-sm sm:text-base font-extrabold tracking-wide">
        {t(COMBO_COPY[type].title)}
      </div>
      <div className="text-[10px] sm:text-xs font-bold [text-shadow:none] text-[#D4002A]">
        {t(COMBO_COPY[type].sub)}
      </div>
    </div>
  </div>
);
