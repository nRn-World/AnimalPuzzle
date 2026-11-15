/**
 * Challenge a friend: a link carries the seed of a time-mode board and the
 * score to beat. No server is involved – everything is in the address.
 */
export const CHALLENGE_PARAM = 'utmaning';

export interface Challenge {
  /** Seed of the starting board, so both players begin with the same animals. */
  seed: string;
  /** The score to beat. */
  score: number;
}

/** Reads a challenge from a query string such as "?utmaning=k3f9a2.12400". */
export function parseChallenge(search: string): Challenge | null {
  let value: string | null;
  try {
    value = new URLSearchParams(search).get(CHALLENGE_PARAM);
  } catch {
    return null;
  }
  const match = value ? /^([a-z0-9]{4,16})\.(\d{1,9})$/.exec(value) : null;
  if (!match) return null;
  const score = Number(match[2]);
  return score > 0 ? { seed: match[1], score } : null;
}

export function challengeUrl(baseUrl: string, challenge: Challenge): string {
  return `${baseUrl}?${CHALLENGE_PARAM}=${challenge.seed}.${Math.max(1, Math.round(challenge.score))}`;
}

export function newChallengeSeed(rng: () => number = Math.random): string {
  let seed = '';
  while (seed.length < 8) seed += Math.floor(rng() * 36).toString(36);
  return seed;
}
