/**
 * One-off: add all existing event sponsor representatives (and legacy person_id)
 * as judges on competition events, without removing anyone already on the panel.
 *
 * Run: npx tsx src/scripts/backfill-sponsor-reps-as-judges.ts
 */
import "dotenv/config";
import { eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  events,
  eventSponsors,
  eventSponsorRepresentatives,
  eventJudges,
  isCompetitionEvent,
  type EventType,
} from "../db/schema.js";

async function main() {
  const competitionEvents = await db
    .select({ id: events.id, name: events.name, type: events.type })
    .from(events);

  let addedTotal = 0;

  for (const event of competitionEvents) {
    if (!isCompetitionEvent(event.type as EventType)) continue;

    const sponsors = await db
      .select({
        id: eventSponsors.id,
        personId: eventSponsors.personId,
      })
      .from(eventSponsors)
      .where(eq(eventSponsors.eventId, event.id));

    if (sponsors.length === 0) continue;

    const repRows = await db
      .select({
        userId: eventSponsorRepresentatives.userId,
      })
      .from(eventSponsorRepresentatives)
      .where(
        inArray(
          eventSponsorRepresentatives.eventSponsorId,
          sponsors.map((s) => s.id)
        )
      );

    const userIds = [
      ...new Set([
        ...repRows.map((r) => r.userId),
        ...sponsors.map((s) => s.personId).filter((id): id is string => Boolean(id)),
      ]),
    ];

    if (userIds.length === 0) continue;

    const existing = await db
      .select({ userId: eventJudges.userId })
      .from(eventJudges)
      .where(eq(eventJudges.eventId, event.id));
    const existingSet = new Set(existing.map((r) => r.userId));
    const toInsert = userIds.filter((id) => !existingSet.has(id));

    if (toInsert.length === 0) {
      console.log(`OK  ${event.name}: already has all ${userIds.length} sponsor rep(s) as judges`);
      continue;
    }

    await db.insert(eventJudges).values(
      toInsert.map((userId) => ({ eventId: event.id, userId }))
    );
    addedTotal += toInsert.length;
    console.log(
      `ADD ${event.name}: +${toInsert.length} judge(s) (of ${userIds.length} sponsor rep(s))`
    );
  }

  console.log(`Done. Added ${addedTotal} judge row(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
