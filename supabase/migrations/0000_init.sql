CREATE TABLE "deals" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"property_id" text NOT NULL,
	"requirement_id" text NOT NULL,
	"stage" text NOT NULL,
	"followup" text DEFAULT '' NOT NULL,
	"collected" double precision DEFAULT 0 NOT NULL,
	"reward_rate" double precision DEFAULT 0 NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"record" text NOT NULL,
	"action" text NOT NULL,
	"created" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"owner" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"organisation" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"license_number" text DEFAULT '' NOT NULL,
	"license_authority" text DEFAULT '' NOT NULL,
	"verification" text NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"locality" text DEFAULT '' NOT NULL,
	"type" text NOT NULL,
	"area" double precision NOT NULL,
	"price" double precision NOT NULL,
	"transaction" text NOT NULL,
	"construction" text NOT NULL,
	"market" text NOT NULL,
	"verification" text NOT NULL,
	"parking" integer NOT NULL,
	"months" integer NOT NULL,
	"consent" boolean NOT NULL,
	"source" text NOT NULL,
	"owner_contact" text DEFAULT '' NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirements" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"type" text NOT NULL,
	"min_area" double precision NOT NULL,
	"max_area" double precision NOT NULL,
	"budget" double precision NOT NULL,
	"transaction" text NOT NULL,
	"parking" integer NOT NULL,
	"months" integer NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "deals_owner_idx" ON "deals" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "events_owner_idx" ON "events" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "requirements_owner_idx" ON "requirements" USING btree ("owner");--> statement-breakpoint
-- The app reads and writes only through its own server (DATABASE_URL), never through
-- Supabase's public API. Row level security with no policies blocks the public API.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "requirements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
