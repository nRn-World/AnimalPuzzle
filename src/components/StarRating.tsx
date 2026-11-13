import React from 'react';

const sizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-10 h-10 sm:w-12 sm:h-12',
} as const;

const StarIcon: React.FC<{ filled: boolean; className: string }> = ({ filled, className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={filled ? 0 : 1.8}
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polygon points="12,2.4 15.1,8.9 22.2,9.8 17,14.7 18.3,21.7 12,18.3 5.7,21.7 7,14.7 1.8,9.8 8.9,8.9" />
  </svg>
);

export interface StarRatingProps {
  stars: number;
  size?: keyof typeof sizes;
  animated?: boolean;
  className?: string;
  label?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  stars,
  size = 'md',
  animated = false,
  className = '',
  label,
}) => {
  const clamped = Math.max(0, Math.min(3, Math.round(stars)));
  return (
    <div
      role="img"
      aria-label={label ?? `${clamped} av 3 stjärnor`}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {[1, 2, 3].map((index) => {
        const filled = index <= clamped;
        return (
          <span
            key={index}
            className={filled ? 'text-[#F5B841]' : 'text-[#5B6A80]'}
            style={
              animated
                ? { animationDelay: `${index * 120}ms` }
                : undefined
            }
          >
            <StarIcon
              filled={filled}
              className={`${sizes[size]} ${filled ? 'drop-shadow-[0_2px_4px_rgba(245,184,65,0.45)]' : ''} ${
                animated ? 'animate-star-pop' : ''
              }`}
            />
          </span>
        );
      })}
    </div>
  );
};
