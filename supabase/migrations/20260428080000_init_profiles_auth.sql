-- Phase 1: profiles + user_roles + triggers (@buffer.com gate, auto-create profile)

-- ============================================================
-- Tables
-- ============================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  real_name text not null,
  nickname text,
  avatar_url text,
  country text check (country is null or length(country) = 2),
  opted_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- ============================================================
-- updated_at trigger
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- @buffer.com email gate (rejects signup before user is created)
-- ============================================================

create or replace function public.enforce_buffer_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '@buffer\.com$' then
    raise exception 'Only @buffer.com emails can register for BufferPong'
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger enforce_buffer_email_trigger
  before insert on auth.users
  for each row execute function public.enforce_buffer_email();

-- ============================================================
-- Auto-create profile row when a new auth.users row is created
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, real_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      initcap(replace(split_part(new.email, '@', 1), '.', ' '))
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- Profiles: anyone (signed in or not) can read all profiles.
-- Real name + nickname + country show up on the public bracket.
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users can update only their own profile, and cannot change the email.
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and email = (select email from public.profiles where id = auth.uid()));

-- Inserts happen via the trigger; no client-side insert is needed,
-- but allow it just in case (must match the user's own id).
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- user_roles: anyone can see who's an admin (used to gate UI)
create policy "Roles are publicly readable"
  on public.user_roles for select
  using (true);

-- Only existing admins can grant or revoke admin.
-- Bootstrap: insert your first admin row directly via SQL.
create policy "Admins manage roles"
  on public.user_roles for all
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
