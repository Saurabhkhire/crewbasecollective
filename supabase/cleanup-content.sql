-- Run in Supabase SQL editor after verifying static JSON migration.
-- Drops all content tables; keeps subscribers only.
-- Or use: npm run cleanup:supabase

drop table if exists request_events cascade;
drop table if exists requests cascade;
drop table if exists event_photos cascade;
drop table if exists event_links cascade;
drop table if exists event_hosts cascade;
drop table if exists event_judges cascade;
drop table if exists event_speakers cascade;
drop table if exists schedule_speakers cascade;
drop table if exists schedule_live_state cascade;
drop table if exists schedule_items cascade;
drop table if exists prizes cascade;
drop table if exists event_sponsor_representatives cascade;
drop table if exists event_sponsors cascade;
drop table if exists event_partners cascade;
drop table if exists track_partners cascade;
drop table if exists track_sponsors cascade;
drop table if exists tracks cascade;
drop table if exists projects cascade;
drop table if exists registrations cascade;
drop table if exists events cascade;
drop table if exists users cascade;
drop table if exists companies cascade;
drop table if exists admin_users cascade;

create table if not exists subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create index if not exists subscribers_created_at_idx on subscribers (created_at desc);
