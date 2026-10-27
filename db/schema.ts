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
    market: text("market").notNull(),
    verification: text("verification").notNull(),
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
    followup: text("followup").notNull().default(""),
    collected: doublePrecision("collected").notNull().default(0),
    rewardRate: doublePrecision("reward_rate").notNull().default(0),
    created: time("created"),
    updated: time("updated"),
  },
  (t) => [index("deals_owner_idx").on(t.owner)],
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
