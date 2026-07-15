create extension if not exists pgcrypto;
create table if not exists public.cfdt_import_jobs (
 id uuid primary key default gen_random_uuid(),
 status text not null default 'review' check (status in ('review','approved','published','failed')),
 source_files jsonb not null default '[]'::jsonb,
 extracted_package jsonb not null default '{}'::jsonb,
 reviewed_package jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 published_at timestamptz
);
create or replace function public.set_cfdt_import_jobs_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists cfdt_import_jobs_updated_at on public.cfdt_import_jobs;
create trigger cfdt_import_jobs_updated_at before update on public.cfdt_import_jobs for each row execute procedure public.set_cfdt_import_jobs_updated_at();
alter table public.cfdt_import_jobs enable row level security;
