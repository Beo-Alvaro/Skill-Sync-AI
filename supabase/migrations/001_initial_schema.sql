create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.freelancer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  niche text not null,
  experience_level text not null check (experience_level in ('beginner', 'intermediate', 'expert')),
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.freelancer_profiles(id) on delete cascade,
  skill text not null,
  unique(profile_id, skill)
);

create table if not exists public.profile_tools (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.freelancer_profiles(id) on delete cascade,
  tool text not null,
  unique(profile_id, tool)
);

create table if not exists public.profile_technologies (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.freelancer_profiles(id) on delete cascade,
  technology text not null,
  unique(profile_id, technology)
);

create table if not exists public.searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  query text not null,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.scraped_jobs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_job_id text not null,
  url text,
  title text not null,
  description text not null,
  budget text,
  proposals text,
  client_rating numeric,
  posted_date text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique(source, source_job_id)
);

create table if not exists public.job_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  search_id uuid not null references public.searches(id) on delete cascade,
  job_id uuid not null references public.scraped_jobs(id) on delete cascade,
  match_percentage integer not null check (match_percentage between 0 and 100),
  skill_overlap jsonb not null default '[]'::jsonb,
  niche_relevance integer not null check (niche_relevance between 0 and 100),
  difficulty_estimation text not null check (difficulty_estimation in ('low', 'medium', 'high')),
  why_matches text not null,
  missing_skills jsonb not null default '[]'::jsonb,
  estimated_fit text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_searches_user_created on public.searches(user_id, created_at desc);
create index if not exists idx_scraped_jobs_source_job on public.scraped_jobs(source, source_job_id);
create index if not exists idx_job_matches_user_search on public.job_matches(user_id, search_id);
create index if not exists idx_job_matches_percentage on public.job_matches(match_percentage desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.freelancer_profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_tools enable row level security;
alter table public.profile_technologies enable row level security;
alter table public.searches enable row level security;
alter table public.scraped_jobs enable row level security;
alter table public.job_matches enable row level security;

create policy "Users can read own user row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own user row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own profile"
  on public.freelancer_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own profile skills"
  on public.profile_skills for all
  using (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_skills.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_skills.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  );

create policy "Users manage own profile tools"
  on public.profile_tools for all
  using (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_tools.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_tools.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  );

create policy "Users manage own profile technologies"
  on public.profile_technologies for all
  using (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_technologies.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.freelancer_profiles
      where freelancer_profiles.id = profile_technologies.profile_id
        and freelancer_profiles.user_id = auth.uid()
    )
  );

create policy "Users manage own searches"
  on public.searches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Authenticated users can read scraped jobs through matches"
  on public.scraped_jobs for select
  using (
    exists (
      select 1 from public.job_matches
      where job_matches.job_id = scraped_jobs.id
        and job_matches.user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert scraped jobs"
  on public.scraped_jobs for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update scraped jobs"
  on public.scraped_jobs for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Users manage own matches"
  on public.job_matches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
