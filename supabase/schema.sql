-- AnimalPuzzle optional Supabase schema
-- Paste this into the Supabase SQL Editor to enable Cloud Save & Global Leaderboards.

create table if not exists public.player_saves (
  player_id text primary key,
  handle text not null default 'Spelare',
  save_json text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard_entries (
  board text not null check (board in ('league', 'blitz')),
  period_key text not null,
  player_id text not null,
  handle text not null default 'Spelare',
  color text not null default 'ruby',
  -- The client clamps to the same ceiling (MAX_SUBMITTED_SCORE); a forged
  -- request outside it is rejected by the database instead of shown on a board.
  score integer not null check (score >= 0 and score <= 5000000),
  updated_at timestamptz not null default now(),
  primary key (board, period_key, player_id)
);

create index if not exists leaderboard_top_idx
  on public.leaderboard_entries (board, period_key, score desc);

alter table public.player_saves enable row level security;
alter table public.leaderboard_entries enable row level security;

-- Public anon policies for lightweight sync-ID play. Scores are capped by the
-- CHECK constraint above, but this board is friendly-only: without Supabase Auth
-- and a server-side validator a determined player can still post a plausible
-- score. Treat it as a social board, not a competitive one.
create policy "player_saves_read" on public.player_saves for select using (true);
create policy "player_saves_write" on public.player_saves for insert with check (true);
create policy "player_saves_update" on public.player_saves for update using (true);

create policy "leaderboard_read" on public.leaderboard_entries for select using (true);
create policy "leaderboard_write" on public.leaderboard_entries for insert with check (true);
create policy "leaderboard_update" on public.leaderboard_entries for update using (true);
