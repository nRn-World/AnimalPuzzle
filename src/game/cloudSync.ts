/**
 * Optional Supabase Cloud Save & Global Leaderboard client.
 *
 * Uses plain `fetch()` against Supabase PostgREST so the app stays zero-dependency
 * and runs 100% locally whenever no Supabase URL/key is configured.
 *
 * Configuration priority:
 *  1. User-supplied config in Settings (persisted locally)
 *  2. Build-time env vars VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
 */
import { exportSave, importSave } from './saveFile';
import { readJson, STORAGE_KEYS, writeJson } from './storage';
import { GemColor } from './types';

export interface CloudConfig {
  url: string;
  anonKey: string;
}

export interface PlayerProfile {
  /** Stable random sync ID linking this device/player in Supabase. */
  playerId: string;
  /** Display name shown in Weekly League and Global Leaderboards. */
  handle: string;
  lastSyncedAt: string | null;
}

export interface GlobalLeaderboardRow {
  playerId: string;
  handle: string;
  color: GemColor;
  score: number;
  rank: number;
  isPlayer: boolean;
}

export type LeaderboardBoard = 'league' | 'blitz';

function generatePlayerId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return 'ap_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function createInitialProfile(): PlayerProfile {
  return {
    playerId: generatePlayerId(),
    handle: '',
    lastSyncedAt: null,
  };
}

export function sanitizeProfile(raw: unknown): PlayerProfile {
  if (!raw || typeof raw !== 'object') return createInitialProfile();
  const obj = raw as Record<string, unknown>;
  const playerId =
    typeof obj.playerId === 'string' && /^ap_[a-zA-Z0-9_-]{6,48}$/.test(obj.playerId)
      ? obj.playerId
      : generatePlayerId();
  const handle =
    typeof obj.handle === 'string' ? obj.handle.trim().slice(0, 18) : '';
  const lastSyncedAt =
    typeof obj.lastSyncedAt === 'string' ? obj.lastSyncedAt : null;
  return { playerId, handle, lastSyncedAt };
}

export function readPlayerProfile(): PlayerProfile {
  const existing = readJson(STORAGE_KEYS.playerProfile);
  const profile = sanitizeProfile(existing);
  if (!existing) writeJson(STORAGE_KEYS.playerProfile, profile);
  return profile;
}

export function writePlayerProfile(profile: PlayerProfile): void {
  writeJson(STORAGE_KEYS.playerProfile, profile);
}

export function normalizeCloudConfig(raw: unknown): CloudConfig {
  const env = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
  const envUrl = (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/g, '');
  const envKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();

  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const url = typeof obj.url === 'string' ? obj.url.trim().replace(/\/+$/g, '') : '';
    const anonKey = typeof obj.anonKey === 'string' ? obj.anonKey.trim() : '';
    if (url && anonKey) return { url, anonKey };
  }
  return { url: envUrl, anonKey: envKey };
}

export function isCloudConfigured(cfg: CloudConfig): boolean {
  return /^https?:\/\/.+/.test(cfg.url) && cfg.anonKey.length >= 16;
}

export function readCloudConfig(): CloudConfig {
  return normalizeCloudConfig(readJson(STORAGE_KEYS.cloudConfig));
}

export function writeCloudConfig(cfg: CloudConfig): void {
  writeJson(STORAGE_KEYS.cloudConfig, {
    url: cfg.url.trim().replace(/\/+$/g, ''),
    anonKey: cfg.anonKey.trim(),
  });
}

function supabaseHeaders(cfg: CloudConfig, prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    'Content-Type': 'application/json',
  };
  if (prefer) headers.Prefer = prefer;
  return headers;
}

export type CloudOpResult =
  | { ok: true; syncedAt: string }
  | { ok: false; reason: 'not_configured' | 'network' | 'not_found' | 'invalid' };

/** Uploads the full local save snapshot to Supabase `player_saves`. */
export async function pushCloudSave(
  cfg: CloudConfig,
  profile: PlayerProfile,
  fetchFn: typeof fetch = fetch
): Promise<CloudOpResult> {
  if (!isCloudConfigured(cfg)) return { ok: false, reason: 'not_configured' };
  const payload = exportSave();
  const syncedAt = new Date().toISOString();
  try {
    const res = await fetchFn(`${cfg.url}/rest/v1/player_saves?on_conflict=player_id`, {
      method: 'POST',
      headers: supabaseHeaders(cfg, 'resolution=merge-duplicates,return=minimal'),
      body: JSON.stringify({
        player_id: profile.playerId,
        handle: profile.handle || 'Spelare',
        save_json: payload,
        updated_at: syncedAt,
      }),
    });
    if (!res.ok) return { ok: false, reason: 'network' };
    return { ok: true, syncedAt };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** Downloads a saved snapshot for `playerId` from Supabase and applies it locally. */
export async function pullCloudSave(
  cfg: CloudConfig,
  playerId: string,
  fetchFn: typeof fetch = fetch
): Promise<CloudOpResult> {
  if (!isCloudConfigured(cfg)) return { ok: false, reason: 'not_configured' };
  const cleanId = playerId.trim();
  if (!cleanId) return { ok: false, reason: 'invalid' };
  try {
    const res = await fetchFn(
      `${cfg.url}/rest/v1/player_saves?player_id=eq.${encodeURIComponent(cleanId)}&select=save_json,updated_at&limit=1`,
      { method: 'GET', headers: supabaseHeaders(cfg) }
    );
    if (!res.ok) return { ok: false, reason: 'network' };
    const rows = (await res.json()) as Array<{ save_json?: string; updated_at?: string }>;
    if (!Array.isArray(rows) || rows.length === 0 || typeof rows[0]?.save_json !== 'string') {
      return { ok: false, reason: 'not_found' };
    }
    const ok = importSave(rows[0].save_json);
    if (!ok) return { ok: false, reason: 'invalid' };
    return { ok: true, syncedAt: rows[0].updated_at ?? new Date().toISOString() };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** Submits the player's weekly league or blitz score to Supabase `leaderboard_entries`. */
export async function submitGlobalScore(
  cfg: CloudConfig,
  input: {
    board: LeaderboardBoard;
    periodKey: string;
    playerId: string;
    handle: string;
    color: GemColor;
    score: number;
  },
  fetchFn: typeof fetch = fetch
): Promise<boolean> {
  if (!isCloudConfigured(cfg) || input.score <= 0) return false;
  try {
    const res = await fetchFn(
      `${cfg.url}/rest/v1/leaderboard_entries?on_conflict=board,period_key,player_id`,
      {
        method: 'POST',
        headers: supabaseHeaders(cfg, 'resolution=merge-duplicates,return=minimal'),
        body: JSON.stringify({
          board: input.board,
          period_key: input.periodKey,
          player_id: input.playerId,
          handle: input.handle || 'Spelare',
          color: input.color,
          score: Math.round(input.score),
          updated_at: new Date().toISOString(),
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetches the top 20 global scores for the given board & week key. */
export async function fetchGlobalLeaderboard(
  cfg: CloudConfig,
  board: LeaderboardBoard,
  periodKey: string,
  myPlayerId: string,
  fetchFn: typeof fetch = fetch
): Promise<GlobalLeaderboardRow[] | null> {
  if (!isCloudConfigured(cfg)) return null;
  try {
    const res = await fetchFn(
      `${cfg.url}/rest/v1/leaderboard_entries?board=eq.${encodeURIComponent(board)}&period_key=eq.${encodeURIComponent(periodKey)}&select=player_id,handle,color,score&order=score.desc&limit=20`,
      { method: 'GET', headers: supabaseHeaders(cfg) }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{
      player_id: string;
      handle: string;
      color?: string;
      score: number;
    }>;
    if (!Array.isArray(rows)) return null;
    return rows.map((row, idx) => ({
      playerId: row.player_id,
      handle: row.handle || 'Spelare',
      color: (row.color as GemColor) || 'ruby',
      score: Math.max(0, Math.round(row.score ?? 0)),
      rank: idx + 1,
      isPlayer: row.player_id === myPlayerId,
    }));
  } catch {
    return null;
  }
}
