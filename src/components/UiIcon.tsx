import React from 'react';

/**
 * Icons from Kenney's "Game Icons" pack (CC0, www.kenney.nl).
 * They are white PNGs used as a mask, so they take the current text colour.
 */
const ICON_URLS = import.meta.glob<string>('../assets/ui/icons/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const BY_NAME: Record<string, string> = {};
for (const [path, url] of Object.entries(ICON_URLS)) {
  const name = path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, '');
  BY_NAME[name] = url;
}

export type UiIconName =
  | 'gear'
  | 'question'
  | 'larger'
  | 'smaller'
  | 'locked'
  | 'unlocked'
  | 'star'
  | 'trophy'
  | 'home'
  | 'pause'
  | 'return'
  | 'audioOn'
  | 'audioOff'
  | 'musicOn'
  | 'musicOff'
  | 'right'
  | 'left'
  | 'up'
  | 'down'
  | 'next'
  | 'previous'
  | 'checkmark'
  | 'cross'
  | 'share2'
  | 'medal1'
  | 'medal2'
  | 'information'
  | 'exclamation'
  | 'target'
  | 'leaderboardsComplex'
  | 'menuList'
  | 'wrench'
  | 'power'
  | 'exitLeft'
  | 'warning'
  | 'plus'
  | 'minus'
  | 'flag'
  | 'diamond'
  | 'key';

export const UiIcon: React.FC<{ name: UiIconName; className?: string }> = ({
  name,
  className = 'w-4 h-4',
}) => (
  <span
    aria-hidden="true"
    className={`ui-icon ${className}`}
    style={{ '--ui-icon': `url("${BY_NAME[name] ?? ''}")` } as React.CSSProperties}
  />
);
