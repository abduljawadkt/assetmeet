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
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deals_owner_idx" ON "deals" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "events_owner_idx" ON "events" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "properties_owner_idx" ON "properties" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "requirements_owner_idx" ON "requirements" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");