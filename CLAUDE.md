# BufferPong

A PWA ping-pong tournament tracker for the Buffer team's Retreat '26. **Rebuild for learning** of an app originally built on Lovable (https://bufferpong.lovable.app). The original is reverse-engineered, not cloned — we own the source.

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind v4 (CSS-first config in `src/index.css`, no `tailwind.config.js`)
- React Router v7
- `@supabase/supabase-js` v2 — auth + Postgres + Realtime
- `@tanstack/react-query` (provider wired, not heavily used yet)
- shadcn/ui — **not** installed; we hand-roll components in `src/components/`
- `lucide-react` icons, `react-markdown`, `clsx + tailwind-merge` (cn)
- `@tailwindcss/typography` for markdown rendering

## Key URLs

| | |
|---|---|
| Production | https://bufferpong.vercel.app |
| GitHub | https://github.com/andrewh-buffer/bufferpong |
| Vercel project | `andrewh-buffers-projects/bufferpong` |
| Supabase project | `zqpqfaetwmudbrkquxlj` |
| Supabase dashboard | https://supabase.com/dashboard/project/zqpqfaetwmudbrkquxlj |

## Local dev

```sh
npm run dev          # http://localhost:5173
npx tsc -b           # typecheck (run before commits)
```

`.env.local` holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (the new `sb_publishable_*` format). Same vars are set on Vercel for production + development envs.

## Database

Migrations in `supabase/migrations/`. Apply with:

```sh
supabase db push     # asks for confirm; uses linked project
```

The CLI is linked to project `zqpqfaetwmudbrkquxlj`. If `supabase link` was lost, re-run `supabase login && supabase link --project-ref zqpqfaetwmudbrkquxlj`.

**Schema highlights** (read the migrations for full detail):
- `profiles` — one per `auth.users`, auto-created by trigger from `raw_user_meta_data->>'full_name'`
- `user_roles` — only `'admin'` role; bootstrap by direct SQL insert
- `tournament_state` — singleton row (id=1)
- `rules_content` — markdown sections, `section_key` PK
- `players` — per-tournament-instance row referencing a profile
- `matches` — bracket nodes; `bracket in ('main','consolation')`, `next_match_id` for winner advancement, `loser_next_match_id` for main R1 → consolation routing
- `is_admin(uid)` — security-definer SQL function used in RLS policies

**RLS pattern**: every table has public-read + admin-write policies. Profiles are publicly readable too (real_name + nickname show up on the public bracket).

**Auth gate**: a `BEFORE INSERT` trigger on `auth.users` rejects any email not matching `@buffer\.com$`. Server-side, can't be bypassed.

**Realtime**: `tournament_state` and `matches` are added to `supabase_realtime` publication. Subscribe via `supabase.channel(...).on("postgres_changes", ...)`.

## Auth flow

Magic link only — **no Google OAuth** (Buffer's Workspace admin doesn't allow third-party OAuth apps). Sign-in → `signInWithOtp({ email, options: { emailRedirectTo: <origin>/auth/callback } })`. The callback page lets `supabase-js` auto-exchange the code (PKCE flow, defaults), waits for `onAuthStateChange`, redirects to `/my-match`.

## Routing

```
/auth          → magic-link form (public)
/auth/callback → token exchange + redirect (public)
/bracket       → public, empty until bracket generated
/rules         → public, markdown sections
/my-match      → RequireAuth
/profile       → RequireAuth
/admin         → RequireAuth (Phase 3+ also gates by role)
```

Protected routes use `<RequireAuth>` from `src/components/RequireAuth.tsx`. Unauthenticated users see "Sign in" link in the header.

## Brand tokens (Tailwind v4 `@theme`)

```
--color-bp-green       #1f3a2e   (primary)
--color-bp-green-50    #2d5444   (hover)
--color-bp-cream       #f5f0e6   (background)
--color-bp-cream-dark  #e8dfca   (borders)
--color-bp-ink         #1a1a1a
--color-bp-muted       #6b6b6b
```

Use as `bg-bp-cream`, `text-bp-green`, etc.

## Deploy

```sh
vercel --prod --yes  # from project root
```

`vercel.json` has the SPA fallback rewrite (`/(.*)` → `/index.html`).

## Phase status

Plan lives at `~/.claude/plans/go-check-out-bufferpong-lovable-app-http-rosy-squid.md`.

- ✅ Phase 0 — env setup (gh, supabase, vercel CLIs in `~/bin`)
- ✅ Phase 1 — auth + profile (magic link, @buffer.com gate, profile editor with country flag)
- 🔄 Phase 2 — public bracket + rules (tables + empty-state UI built, **migration applied**, bracket-render itself is Phase 3)
- ⏭️ Phase 3 — admin + bracket generation (single-elim main + consolation)
- ⏭️ Phase 4 — my-match scoring + forfeits
- ⏭️ Phase 5 — admin polish (snapshots, broadcasts, deadlines)
- ⏭️ Phase 6 — PWA install + push

## Known TODOs (not blocking)

- Vercel preview env vars: CLI bug adding non-interactively. Add via dashboard if needed.
- GitHub → Vercel auto-deploy: not connected. Right now you `vercel --prod` manually. Wire via Vercel dashboard → Settings → Git if you want push-to-deploy.
- Email deliverability: Supabase default sender lands in spam. Plug in Resend or similar before real use.
- TypeScript types from Supabase: not generated yet. Run `supabase gen types typescript --linked > src/types/database.ts` and refactor queries to use them.

## Conventions

- Keep components hand-rolled in `src/components/` (no shadcn unless we change our minds)
- One Supabase client, in `src/lib/supabase.ts`. Don't `createClient` elsewhere.
- Use `useAuth()` for session — never call `supabase.auth` directly from components if you can use the hook.
- Path alias `@/*` → `src/*` (configured in `tsconfig.app.json` + `vite.config.ts`)
- All times in DB are `timestamptz`. Render in `Europe/Madrid` (Barcelona) for tournament deadlines.
- Server-side validation always wins. Client checks are UX polish only.

## What "the original" did differently

Lovable's bundle reveals their setup was:
- Google OAuth (managed by "Lovable Cloud Auth JS") — we use magic link
- Same schema shape we adopted; we extended a bit (e.g. explicit `bracket` column on matches)
- WebAuthn/passkey scaffolding present in bundle but not obviously used in the UI
- Country flag picker in profile (we have a 2-letter code + emoji; can upgrade later)
