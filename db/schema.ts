import { pgTable, text, integer, bigint, doublePrecision, boolean, index } from "drizzle-orm/pg-core";

const time = (name: string) => bigint(name, { mode: "number" }).notNull();

// One profile per signed-in account. Role decides which workspace views lead.
export const profiles = pgTable("profiles", {
  owner: text("owner").primaryKey(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  organisation: text("organisation").notNull().default(""),
  phone: text("phone").notNull().default(""),
  licenseNumber: text("license_number").notNull().default(""),
  licenseAuthority: text("license_authority").notNull().default(""),
  verification: text("verification").notNull(),
  // Subscription: a paid plan applies while plan_until (YYYY-MM-DD) is today or later.
  // Set by the AssetMeet team after payment; there is no online checkout yet.
  plan: text("plan").notNull().default("Free"),
  planUntil: text("plan_until").notNull().default(""),
  created: time("created"),
  updated: time("updated"),
});

export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    locality: text("locality").notNull().default(""),
    type: text("type").notNull(),
    area: doublePrecision("area").notNull(),
    price: doublePrecision("price").notNull(),
    transaction: text("transaction").notNull(),
    construction: text("construction").notNull(),
    status: text("status").notNull().default("Mapped"),
    verification: text("verification").notNull(),
    visibility: text("visibility").notNull().default("Private"),
    parking: integer("parking").notNull(),
    months: integer("months").notNull(),
    consent: boolean("consent").notNull(),
    source: text("source").notNull(),
    ownerContact: text("owner_contact").notNull().default(""),
    created: time("created"),
    updated: time("updated"),
  },
  (t) => [index("properties_owner_idx").on(t.owner)],
);

export const requirements = pgTable(
  "requirements",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    type: text("type").notNull(),
    minArea: doublePrecision("min_area").notNull(),
    maxArea: doublePrecision("max_area").notNull(),
    budget: doublePrecision("budget").notNull(),
    transaction: text("transaction").notNull(),
    parking: integer("parking").notNull(),
    months: integer("months").notNull(),
    status: text("status").notNull().default("Draft"),
    created: time("created"),
    updated: time("updated"),
  },
  (t) => [index("requirements_owner_idx").on(t.owner)],
);

export const deals = pgTable(
  "deals",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    propertyId: text("property_id").notNull(),
    requirementId: text("requirement_id").notNull(),
    stage: text("stage").notNull(),
    leadSource: text("lead_source").notNull().default(""),
    value: doublePrecision("value").notNull().default(0),
    mandateSigned: boolean("mandate_signed").notNull().default(false),
    mandateParty: text("mandate_party").notNull().default("Owner"),
    exclusivity: text("exclusivity").notNull().default(""),
    trigger: text("trigger").notNull().default(""),
    optIn: boolean("opt_in").notNull().default(false),
    assignee: text("assignee").notNull().default(""),
    nextAction: text("next_action").notNull().default(""),
    followup: text("followup").notNull().default(""),
    notes: text("notes").notNull().default(""),
    sourceTier: text("source_tier").notNull().default("Data contributor"),
    rewardRate: doublePrecision("reward_rate").notNull().default(0),
    payoutStatus: text("payout_status").notNull().default("Not due"),
    created: time("created"),
    updated: time("updated"),
  },
  (t) => [index("deals_owner_idx").on(t.owner), index("deals_property_idx").on(t.propertyId), index("deals_requirement_idx").on(t.requirementId)],
);

// Opportunity Bank: unmet demand converted into site search, feasibility and projects.
export const opportunities = pgTable("opportunities", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  name: text("name").notNull(),
  requirementId: text("requirement_id").notNull(),
  propertyId: text("property_id").notNull().default(""),
  stage: text("stage").notNull(),
  assignee: text("assignee").notNull().default(""),
  nextAction: text("next_action").notNull().default(""),
  followup: text("followup").notNull().default(""),
  notes: text("notes").notNull().default(""),
  created: time("created"),
  updated: time("updated"),
});

// Every fee from brokerage, sourcing, feasibility, design and PMC, tracked from
// pipeline to contracted, invoiced and collected. Subscriptions are worked out from profiles.
export const fees = pgTable(
  "fees",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    stream: text("stream").notNull(),
    linkKind: text("link_kind").notNull().default(""),
    linkId: text("link_id").notNull().default(""),
    payer: text("payer").notNull(),
    trigger: text("trigger").notNull().default(""),
    status: text("status").notNull(),
    amount: doublePrecision("amount").notNull().default(0),
    agreement: boolean("agreement").notNull().default(false),
    disclosed: boolean("disclosed").notNull().default(false),
    invoice: text("invoice").notNull().default(""),
    collectedOn: text("collected_on").notNull().default(""),
    created: time("created"),
    updated: time("updated"),
  },
  (t) => [index("fees_link_idx").on(t.linkId)],
);

// Append-only audit trail of every create, update and delete.
export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    record: text("record").notNull(),
    action: text("action").notNull(),
    created: time("created"),
  },
  (t) => [index("events_owner_idx").on(t.owner)],
);

export * from "./auth-schema";
