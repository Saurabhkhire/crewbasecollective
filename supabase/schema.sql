-- Minimal Supabase schema for Crewbase Collective (production)
-- Run in Supabase SQL editor after cutting over from full Postgres content.

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists subscribers_created_at_idx on subscribers (created_at desc);
