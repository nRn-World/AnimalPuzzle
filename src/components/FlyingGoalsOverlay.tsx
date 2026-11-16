import React from 'react';
import { AnimalSkinId, GemColor, ObjectiveKind } from '../game/types';
import {
  ChainBadgeIcon,
  CrateSvg,
  EggSvg,
  GemSvg,
  HoneySvg,
  IceBadgeIcon,
} from './GemSvg';
import { UiIcon } from './UiIcon';

export interface FlyingGoalToken {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  arcY: number;
  kind: ObjectiveKind;
  color?: GemColor;
  skin: AnimalSkinId;
  delayMs: number;
}

interface FlyingGoalsOverlayProps {
  tokens: FlyingGoalToken[];
}

export const FlyingGoalsOverlay: React.FC<FlyingGoalsOverlayProps> = ({ tokens }) => {
  if (tokens.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-45 overflow-hidden"
    >
      {tokens.map((tok) => {
        const dx = tok.toX - tok.fromX;
        const dy = tok.toY - tok.fromY;
        const style = {
          left: tok.fromX,
          top: tok.fromY,
          '--fly-dx': `${dx.toFixed(1)}px`,
          '--fly-dy': `${dy.toFixed(1)}px`,
          '--fly-arc': `${tok.arcY.toFixed(1)}px`,
          animationDelay: `${tok.delayMs}ms`,
        } as React.CSSProperties;

        return (
          <div key={tok.id} style={style} className="ui-fly-goal">
            {tok.kind === 'color' && tok.color ? (
              <GemSvg
                color={tok.color}
                special="none"
                skin={tok.skin}
                animationSeed={tok.id}
                className="h-full w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.7)]"
              />
            ) : tok.kind === 'boss' && tok.color ? (
              <div className="relative h-full w-full">
                <GemSvg
                  color={tok.color}
                  special="none"
                  skin={tok.skin}
                  animationSeed={tok.id}
                  className="h-full w-full drop-shadow-[0_0_8px_rgba(255,46,77,0.85)]"
                />
              </div>
            ) : tok.kind === 'ice' ? (
              <IceBadgeIcon className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            ) : tok.kind === 'crate' ? (
              <CrateSvg hp={1} className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            ) : tok.kind === 'chain' ? (
              <ChainBadgeIcon className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            ) : tok.kind === 'honey' ? (
              <HoneySvg className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            ) : tok.kind === 'egg' ? (
              <EggSvg className="h-full w-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
            ) : (
              <UiIcon name="star" className="h-full w-full text-[#F2CD1C] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]" />
            )}
          </div>
        );
      })}
    </div>
  );
};
