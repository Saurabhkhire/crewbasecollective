/**
 * One-time: remove all content tables from Supabase Postgres after JSON migration.
 * Keeps (or creates) subscribers table only.
 *
 * Usage: npm run cleanup:supabase -w server
 * Requires DATABASE_URL in server/.env
 */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });

  console.log("Dropping content tables...");

  await sql.unsafe(`
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
  `);

  console.log("Ensuring subscribers table exists...");
  await sql.unsafe(`
    create table if not exists subscribers (
      id uuid primary key default gen_random_uuid(),
      email text unique not null,
      created_at timestamptz not null default now()
    );
    create index if not exists subscribers_created_at_idx on subscribers (created_at desc);
  `);

  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text as count from subscribers
  `;

  console.log(`Done. Supabase now has subscribers only (${count} row(s)).`);
  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
