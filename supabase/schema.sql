create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now(),
  stripe_customer_id text,
  subscription_status text not null default 'inactive'
);

create type public.project_type as enum ('masters', 'phd', 'research');
create type public.chapter_status as enum ('idea', 'outline', 'drafting', 'revising', 'supervisor_review', 'complete');
create type public.subsection_status as enum ('planned', 'drafting', 'complete');
create type public.paper_status as enum ('idea', 'drafting', 'submitted', 'r1', 'r2', 'accepted', 'rejected');
create type public.effort_level as enum ('small', 'medium', 'large');

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  type public.project_type not null,
  target_completion_date date not null,
  funding_end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  status public.chapter_status not null default 'idea',
  target_word_count integer not null default 0,
  current_word_count integer not null default 0,
  confidence_rating integer not null check (confidence_rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.subsections (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  status public.subsection_status not null default 'planned',
  scheduled_date date,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.papers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  linked_project_id uuid references public.projects(id) on delete set null,
  title text not null,
  journal_target text,
  status public.paper_status not null default 'idea',
  deadline date,
  effort_level public.effort_level not null default 'medium',
  scheduled_date date,
  google_event_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  linked_project_id uuid references public.projects(id) on delete set null,
  title text not null,
  scheduled_date date not null,
  notes text,
  google_event_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.google_connections (
  user_id uuid primary key references public.users(id) on delete cascade,
  refresh_token text not null,
  scope text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.chapters enable row level security;
alter table public.subsections enable row level security;
alter table public.papers enable row level security;
alter table public.meetings enable row level security;
alter table public.google_connections enable row level security;

create policy "user owns user row" on public.users
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "user owns projects" on public.projects
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns chapters" on public.chapters
for all using (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.projects p
    where p.id = project_id and p.user_id = auth.uid()
  )
);

create policy "user owns subsections" on public.subsections
for all using (
  exists (
    select 1
    from public.chapters c
    join public.projects p on p.id = c.project_id
    where c.id = chapter_id and p.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.chapters c
    join public.projects p on p.id = c.project_id
    where c.id = chapter_id and p.user_id = auth.uid()
  )
);

create policy "user owns papers" on public.papers
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns meetings" on public.meetings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user owns google connection" on public.google_connections
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
