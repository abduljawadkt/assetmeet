import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

// One profile per signed-in account. Role decides which workspace views lead.
export const profiles = sqliteTable("profiles", {
  owner: text("owner").primaryKey(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  organisation: text("organisation").notNull().default(""),
  phone: text("phone").notNull().default(""),
  licenseNumber: text("license_number").notNull().default(""),
  licenseAuthority: text("license_authority").notNull().default(""),
  verification: text("verification").notNull(),
  created: integer("created").notNull(),
  updated: integer("updated").notNull(),
});

export const properties = sqliteTable(
  "properties",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    locality: text("locality").notNull().default(""),
    type: text("type").notNull(),
    area: real("area").notNull(),
    price: real("price").notNull(),
    transaction: text("transaction").notNull(),
    construction: text("construction").notNull(),
    market: text("market").notNull(),
    verification: text("verification").notNull(),
    parking: integer("parking").notNull(),
    months: integer("months").notNull(),
    consent: integer("consent", { mode: "boolean" }).notNull(),
    source: text("source").notNull(),
    ownerContact: text("owner_contact").notNull().default(""),
    created: integer("created").notNull(),
    updated: integer("updated").notNull(),
  },
  (t) => [index("properties_owner_idx").on(t.owner)],
);

export const requirements = sqliteTable(
  "requirements",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    district: text("district").notNull(),
    type: text("type").notNull(),
    minArea: real("min_area").notNull(),
    maxArea: real("max_area").notNull(),
    budget: real("budget").notNull(),
    transaction: text("transaction").notNull(),
    parking: integer("parking").notNull(),
    months: integer("months").notNull(),
    created: integer("created").notNull(),
    updated: integer("updated").notNull(),
  },
  (t) => [index("requirements_owner_idx").on(t.owner)],
);

export const deals = sqliteTable(
  "deals",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    name: text("name").notNull(),
    propertyId: text("property_id").notNull(),
    requirementId: text("requirement_id").notNull(),
    stage: text("stage").notNull(),
    followup: text("followup").notNull().default(""),
    collected: real("collected").notNull().default(0),
    rewardRate: real("reward_rate").notNull().default(0),
    created: integer("created").notNull(),
    updated: integer("updated").notNull(),
  },
  (t) => [index("deals_owner_idx").on(t.owner)],
);

// Append-only audit trail of every create, update and delete.
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    owner: text("owner").notNull(),
    record: text("record").notNull(),
    action: text("action").notNull(),
    created: integer("created").notNull(),
  },
  (t) => [index("events_owner_idx").on(t.owner)],
);

// Legacy JSON store from the first pilot. Kept so existing rows are not lost;
// migration 0001 copies its contents into the tables above.
export const records = sqliteTable("records", {
  id: text("id").primaryKey(),
  owner: text("owner").notNull(),
  kind: text("kind").notNull(),
  data: text("data").notNull(),
  created: integer("created").notNull(),
});
