-- Phase 2: tournament_state + rules_content + players + matches
-- All publicly readable; only admins can write. Matches & tournament_state
-- broadcast changes via Supabase Realtime.

-- ============================================================
-- Helper: is_admin(uid) — used by RLS policies
-- ============================================================

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = uid and role = 'admin'
  );
$$;

-- ============================================================
-- tournament_state — singleton row (id = 1)
-- ============================================================

create table public.tournament_state (
  id int primary key default 1 check (id = 1),
  bracket_generated boolean not null default false,
  registration_deadline timestamptz,
  stage_deadline jsonb not null default '{}'::jsonb,
  -- per-round deadlines, keyed by round number
  -- e.g. { "main:1": "2026-05-15T17:00:00Z", "main:2": "...", "consolation:1": "..." }
  updated_at timestamptz not null default now()
);

insert into public.tournament_state (id) values (1);

create trigger tournament_state_set_updated_at
  before update on public.tournament_state
  for each row execute function public.set_updated_at();

-- ============================================================
-- rules_content — markdown sections, edited by admins
-- ============================================================

create table public.rules_content (
  section_key text primary key,
  title text not null,
  sort_order int not null default 0,
  body_md text not null default '',
  updated_at timestamptz not null default now()
);

create trigger rules_content_set_updated_at
  before update on public.rules_content
  for each row execute function public.set_updated_at();

-- Seed initial sections — admin can edit later
insert into public.rules_content (section_key, title, sort_order, body_md) values
  (
    'welcome', 'Welcome', 1,
    'Welcome to **BufferPong** — the Buffer team ping pong tournament for Retreat ''26.

Anyone with a `@buffer.com` email can register. Sign in to play, or browse the bracket and rules without signing in.'
  ),
  (
    'format', 'Match format', 2,
    '- **Best of 3 games**, each to **11 points** (win by 2).
- Service alternates every 2 points.
- Bring your own paddle if you have one — extras at the venue.'
  ),
  (
    'deadlines', 'Deadlines', 3,
    'Each round has a deadline (Barcelona time). If your match is not played by the deadline, an admin will resolve it (auto: higher score wins, or manually).'
  ),
  (
    'forfeits', 'Forfeits', 4,
    'You can forfeit a match anytime from the **My match** screen.

- Forfeiting in the **main bracket** drops you to the **consolation bracket**. You keep playing.
- Forfeiting in the **consolation bracket** removes you from the tournament.'
  ),
  (
    'consolation', 'Consolation bracket', 5,
    'Lose a main-bracket match? You move to the consolation bracket and keep playing. The consolation final is its own thing — winner gets bragging rights.'
  );

-- ============================================================
-- players — per-tournament-instance row referencing a profile
-- ============================================================

create table public.players (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null,
  -- snapshot of nickname-or-real-name at registration time, for stable bracket labels
  created_at timestamptz not null default now()
);

create unique index players_profile_id_idx on public.players(profile_id);

-- ============================================================
-- matches — bracket nodes; both winners' and losers' bracket
-- ============================================================

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  bracket text not null check (bracket in ('main', 'consolation')),
  round int not null,
  bracket_position int not null,
  player1_id uuid references public.players(id) on delete set null,
  player2_id uuid references public.players(id) on delete set null,
  winner_id uuid references public.players(id) on delete set null,
  score1 int,
  score2 int,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'complete', 'forfeit')),
  -- where the winner advances
  next_match_id uuid references public.matches(id) on delete set null,
  next_match_slot int check (next_match_slot in (1, 2)),
  -- where the loser drops (set on main R1; null elsewhere)
  loser_next_match_id uuid references public.matches(id) on delete set null,
  loser_next_match_slot int check (loser_next_match_slot in (1, 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index matches_bracket_round_idx on public.matches(bracket, round, bracket_position);

create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security — public read, admin write
-- ============================================================

alter table public.tournament_state enable row level security;
alter table public.rules_content enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

create policy "Tournament state is publicly readable"
  on public.tournament_state for select using (true);

create policy "Rules are publicly readable"
  on public.rules_content for select using (true);

create policy "Players are publicly readable"
  on public.players for select using (true);

create policy "Matches are publicly readable"
  on public.matches for select using (true);

create policy "Admins manage tournament state"
  on public.tournament_state for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage rules"
  on public.rules_content for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage players"
  on public.players for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins manage matches"
  on public.matches for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ============================================================
-- Realtime — broadcast changes on tournament_state and matches
-- ============================================================

alter publication supabase_realtime add table public.tournament_state;
alter publication supabase_realtime add table public.matches;
