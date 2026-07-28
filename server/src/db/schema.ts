import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  time,
  decimal,
  integer,
  pgEnum,
  unique,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "participant",
  "speaker",
  "judge",
  "host",
  "volunteer",
  "sponsor_rep",
  "organizer",
  "other",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "hackathon",
  "pitch_competition",
  "workshop",
  "mixer",
  "dinner",
  "demo",
  "other",
]);

export const partnerTypeEnum = pgEnum("partner_type", [
  "venue",
  "technology",
  "community",
  "media",
  "food",
  "other",
  "custom",
]);

export const prizePlacementEnum = pgEnum("prize_placement", [
  "first",
  "second",
  "third",
  "winning",
  "custom",
]);

export const hostTypeEnum = pgEnum("host_type", [
  "host",
  "sponsor",
  "venue_partner",
  "volunteer",
  "other",
]);

export const requestTypeEnum = pgEnum("request_type", [
  "sponsorship",
  "judging_speaking",
  "partnership",
  "member_host",
  "volunteer",
]);

export const judgingSpeakingRoleEnum = pgEnum("judging_speaking_role", [
  "judging",
  "speaking",
  "both",
]);

export const memberHostRoleEnum = pgEnum("member_host_role", [
  "member",
  "host",
]);

export const memberHostScopeEnum = pgEnum("member_host_scope", [
  "all_hackathons",
  "specific_events",
]);

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Companies ───────────────────────────────────────────────────────────────

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  linkedin: text("linkedin"),
  information: text("information"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Users (People) ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  linkedin: text("linkedin"),
  role: userRoleEnum("role").notNull().default("participant"),
  title: varchar("title", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  companyName: varchar("company_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Events ──────────────────────────────────────────────────────────────────

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: eventTypeEnum("type").notNull(),
  description: text("description"),
  theme: varchar("theme", { length: 255 }),
  dayLabel: varchar("day_label", { length: 100 }),
  eventDate: date("event_date").notNull(),
  endDate: date("end_date"),
  startTime: time("start_time"),
  endTime: time("end_time"),
  location: text("location"),
  locationLat: decimal("location_lat", { precision: 10, scale: 7 }),
  locationLng: decimal("location_lng", { precision: 10, scale: 7 }),
  coverImageUrl: text("cover_image_url"),
  coverPageUrl: text("cover_page_url"),
  lumaLink: text("luma_link"),
  eventbriteLink: text("eventbrite_link"),
  groupLink: text("group_link"),
  isPartnerEvent: boolean("is_partner_event").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Registrations ───────────────────────────────────────────────────────────

export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  trackId: uuid("track_id"),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  repoUrl: text("repo_url"),
  demoUrl: text("demo_url"),
  teamNames: text("team_names"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tracks (hackathon & pitch competition) ──────────────────────────────────

export const tracks = pgTable("tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trackSponsors = pgTable(
  "track_sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    trackId: uuid("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    personId: uuid("person_id").references(() => users.id, { onDelete: "set null" }),
    description: text("description"),
  },
  (t) => [unique().on(t.trackId, t.companyId)]
);

export const trackPartners = pgTable("track_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => tracks.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  customName: varchar("custom_name", { length: 255 }),
  partnerType: partnerTypeEnum("partner_type").notNull().default("other"),
  customType: varchar("custom_type", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Event Partners ────────────────────────────────────────────────────────────

export const eventPartners = pgTable("event_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  customName: varchar("custom_name", { length: 255 }),
  partnerType: partnerTypeEnum("partner_type").notNull(),
  customType: varchar("custom_type", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Event Sponsors ──────────────────────────────────────────────────────────

export const eventSponsors = pgTable(
  "event_sponsors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    personId: uuid("person_id").references(() => users.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.eventId, t.companyId)]
);

export const eventSponsorRepresentatives = pgTable(
  "event_sponsor_representatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventSponsorId: uuid("event_sponsor_id")
      .notNull()
      .references(() => eventSponsors.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [unique().on(t.eventSponsorId, t.userId)]
);

// ─── Prizes (hackathon & pitch competition only) ─────────────────────────────

export const prizes = pgTable("prizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  trackId: uuid("track_id").references(() => tracks.id, { onDelete: "set null" }),
  sponsorId: uuid("sponsor_id").references(() => eventSponsors.id, { onDelete: "set null" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  placement: prizePlacementEnum("placement").notNull(),
  customLabel: varchar("custom_label", { length: 100 }),
  prizeName: varchar("prize_name", { length: 255 }).notNull(),
  amount: text("amount"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Schedule ──────────────────────────────────────────────────────────────────

export const scheduleItems = pgTable("schedule_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isSkipped: boolean("is_skipped").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const scheduleSpeakers = pgTable(
  "schedule_speakers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    scheduleItemId: uuid("schedule_item_id")
      .notNull()
      .references(() => scheduleItems.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.scheduleItemId, t.userId)]
);

export const scheduleLiveState = pgTable("schedule_live_state", {
  eventId: uuid("event_id")
    .primaryKey()
    .references(() => events.id, { onDelete: "cascade" }),
  liveReassignmentAt: timestamp("live_reassignment_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Speakers, Judges, Hosts ─────────────────────────────────────────────────

export const eventSpeakers = pgTable("event_speakers", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventDay: date("event_day"),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  topic: varchar("topic", { length: 500 }),
  isSkipped: boolean("is_skipped").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const eventJudges = pgTable(
  "event_judges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 255 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.eventId, t.userId)]
);

export const eventHosts = pgTable(
  "event_hosts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hostType: hostTypeEnum("host_type").notNull().default("host"),
    role: varchar("role", { length: 255 }),
    customType: varchar("custom_type", { length: 100 }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.eventId, t.userId)]
);

// ─── Links & Photos ────────────────────────────────────────────────────────────

export const eventLinks = pgTable("event_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const eventPhotos = pgTable("event_photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  caption: varchar("caption", { length: 500 }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Public Request Forms ──────────────────────────────────────────────────────

export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: requestTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  linkedin: text("linkedin"),
  comments: text("comments"),
  companyName: varchar("company_name", { length: 255 }),
  website: text("website"),
  description: text("description"),
  sponsorshipDetails: text("sponsorship_details"),
  judgingSpeakingRole: judgingSpeakingRoleEnum("judging_speaking_role"),
  partnershipType: partnerTypeEnum("partnership_type"),
  partnershipCustomType: varchar("partnership_custom_type", { length: 100 }),
  memberHostRole: memberHostRoleEnum("member_host_role"),
  memberHostScope: memberHostScopeEnum("member_host_scope"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const requestEvents = pgTable(
  "request_events",
  {
    requestId: uuid("request_id")
      .notNull()
      .references(() => requests.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.eventId] })]
);

// ─── Relations ─────────────────────────────────────────────────────────────────

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  eventSponsors: many(eventSponsors),
  trackSponsors: many(trackSponsors),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, { fields: [users.companyId], references: [companies.id] }),
  eventJudges: many(eventJudges),
  eventSpeakers: many(eventSpeakers),
  eventHosts: many(eventHosts),
}));

export const eventsRelations = relations(events, ({ many, one }) => ({
  tracks: many(tracks),
  eventPartners: many(eventPartners),
  eventSponsors: many(eventSponsors),
  prizes: many(prizes),
  scheduleItems: many(scheduleItems),
  eventSpeakers: many(eventSpeakers),
  eventJudges: many(eventJudges),
  eventHosts: many(eventHosts),
  eventLinks: many(eventLinks),
  eventPhotos: many(eventPhotos),
  registrations: many(registrations),
  projects: many(projects),
  scheduleLiveState: one(scheduleLiveState),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  event: one(events, { fields: [tracks.eventId], references: [events.id] }),
  sponsors: many(trackSponsors),
  partners: many(trackPartners),
  prizes: many(prizes),
}));

export const scheduleItemsRelations = relations(scheduleItems, ({ one, many }) => ({
  event: one(events, { fields: [scheduleItems.eventId], references: [events.id] }),
  speakers: many(scheduleSpeakers),
}));

export const requestsRelations = relations(requests, ({ many }) => ({
  events: many(requestEvents),
}));

// ─── Types ─────────────────────────────────────────────────────────────────────

export type EventType = (typeof eventTypeEnum.enumValues)[number];

export const COMPETITION_EVENT_TYPES: EventType[] = ["hackathon", "pitch_competition"];

export function isCompetitionEvent(type: EventType): boolean {
  return COMPETITION_EVENT_TYPES.includes(type);
}
