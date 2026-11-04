CREATE TABLE "fees" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"stream" text NOT NULL,
	"link_kind" text DEFAULT '' NOT NULL,
	"link_id" text DEFAULT '' NOT NULL,
	"payer" text NOT NULL,
	"trigger" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"amount" double precision DEFAULT 0 NOT NULL,
	"agreement" boolean DEFAULT false NOT NULL,
	"disclosed" boolean DEFAULT false NOT NULL,
	"invoice" text DEFAULT '' NOT NULL,
	"collected_on" text DEFAULT '' NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"requirement_id" text NOT NULL,
	"property_id" text DEFAULT '' NOT NULL,
	"stage" text NOT NULL,
	"assignee" text DEFAULT '' NOT NULL,
	"next_action" text DEFAULT '' NOT NULL,
	"followup" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created" bigint NOT NULL,
	"updated" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "lead_source" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "value" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "mandate_signed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "mandate_party" text DEFAULT 'Owner' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "exclusivity" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "trigger" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "assignee" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "next_action" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "source_tier" text DEFAULT 'Data contributor' NOT NULL;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN "payout_status" text DEFAULT 'Not due' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "plan" text DEFAULT 'Free' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "plan_until" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "status" text DEFAULT 'Mapped' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "visibility" text DEFAULT 'Private' NOT NULL;--> statement-breakpoint
ALTER TABLE "requirements" ADD COLUMN "status" text DEFAULT 'Draft' NOT NULL;--> statement-breakpoint
CREATE INDEX "fees_link_idx" ON "fees" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX "deals_property_idx" ON "deals" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "deals_requirement_idx" ON "deals" USING btree ("requirement_id");--> statement-breakpoint
-- Backfill existing records into the new statuses. Order matters: the property
-- lifecycle is worked out from the old availability and verification first.
UPDATE "properties" SET "status" = CASE
	WHEN "market" = 'Sold / leased' THEN 'Closed'
	WHEN "market" = 'Negotiation' THEN 'In negotiation'
	WHEN "market" = 'Available' THEN 'Available'
	WHEN "verification" = 'Mandate signed' THEN 'Mandated'
	WHEN "verification" = 'Owner confirmed' THEN 'Owner confirmed'
	ELSE 'Mapped'
END;--> statement-breakpoint
UPDATE "deals" d SET "mandate_signed" = true FROM "properties" p WHERE p."id" = d."property_id" AND p."verification" = 'Mandate signed';--> statement-breakpoint
UPDATE "properties" SET "verification" = CASE
	WHEN "verification" IN ('Documents verified', 'Mandate signed') THEN 'Verified'
	ELSE 'Not checked'
END;--> statement-breakpoint
UPDATE "deals" SET "stage" = 'Flagged' WHERE "stage" IN ('Review', 'Owner outreach');--> statement-breakpoint
UPDATE "deals" SET "source_tier" = 'Qualified sourcer' WHERE "reward_rate" > 0;--> statement-breakpoint
UPDATE "requirements" r SET "status" = 'Matching' WHERE EXISTS (SELECT 1 FROM "deals" d WHERE d."requirement_id" = r."id");--> statement-breakpoint
-- Fees already collected on deals become brokerage fee records.
INSERT INTO "fees" ("id", "owner", "name", "stream", "link_kind", "link_id", "payer", "trigger", "status", "amount", "agreement", "disclosed", "invoice", "collected_on", "created", "updated")
SELECT gen_random_uuid()::text, d."owner", 'Brokerage', CASE WHEN p."transaction" IN ('Lease', 'Rent') THEN 'Lease brokerage' ELSE 'Sale brokerage' END,
	'deal', d."id", 'Recorded before the revenue model', '', 'Collected', d."collected", true, false, '', to_char(to_timestamp(d."updated" / 1000), 'YYYY-MM-DD'), d."created", d."updated"
FROM "deals" d LEFT JOIN "properties" p ON p."id" = d."property_id" WHERE d."collected" > 0;
