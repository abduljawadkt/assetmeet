CREATE TABLE `deals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`property_id` text NOT NULL,
	`requirement_id` text NOT NULL,
	`stage` text NOT NULL,
	`followup` text DEFAULT '' NOT NULL,
	`collected` real DEFAULT 0 NOT NULL,
	`reward_rate` real DEFAULT 0 NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `deals_owner_idx` ON `deals` (`owner`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`owner` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`name` text NOT NULL,
	`organisation` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`license_number` text DEFAULT '' NOT NULL,
	`license_authority` text DEFAULT '' NOT NULL,
	`verification` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`district` text NOT NULL,
	`locality` text DEFAULT '' NOT NULL,
	`type` text NOT NULL,
	`area` real NOT NULL,
	`price` real NOT NULL,
	`transaction` text NOT NULL,
	`construction` text NOT NULL,
	`market` text NOT NULL,
	`verification` text NOT NULL,
	`parking` integer NOT NULL,
	`months` integer NOT NULL,
	`consent` integer NOT NULL,
	`source` text NOT NULL,
	`owner_contact` text DEFAULT '' NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `properties_owner_idx` ON `properties` (`owner`);--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`district` text NOT NULL,
	`type` text NOT NULL,
	`min_area` real NOT NULL,
	`max_area` real NOT NULL,
	`budget` real NOT NULL,
	`transaction` text NOT NULL,
	`parking` integer NOT NULL,
	`months` integer NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `requirements_owner_idx` ON `requirements` (`owner`);--> statement-breakpoint
CREATE INDEX `events_owner_idx` ON `events` (`owner`);--> statement-breakpoint
INSERT OR IGNORE INTO `properties` SELECT `id`, `owner`, json_extract(`data`,'$.name'), json_extract(`data`,'$.district'), '', json_extract(`data`,'$.type'), json_extract(`data`,'$.area'), json_extract(`data`,'$.price'), json_extract(`data`,'$.transaction'), json_extract(`data`,'$.construction'), json_extract(`data`,'$.market'), json_extract(`data`,'$.verification'), json_extract(`data`,'$.parking'), json_extract(`data`,'$.months'), json_extract(`data`,'$.consent'), json_extract(`data`,'$.source'), '', `created`, `created` FROM `records` WHERE `kind`='property';--> statement-breakpoint
INSERT OR IGNORE INTO `requirements` SELECT `id`, `owner`, json_extract(`data`,'$.name'), json_extract(`data`,'$.district'), json_extract(`data`,'$.type'), json_extract(`data`,'$.minArea'), json_extract(`data`,'$.maxArea'), json_extract(`data`,'$.budget'), json_extract(`data`,'$.transaction'), json_extract(`data`,'$.parking'), json_extract(`data`,'$.months'), `created`, `created` FROM `records` WHERE `kind`='requirement';--> statement-breakpoint
INSERT OR IGNORE INTO `deals` SELECT `id`, `owner`, json_extract(`data`,'$.name'), json_extract(`data`,'$.assetId'), json_extract(`data`,'$.requirementId'), json_extract(`data`,'$.stage'), coalesce(json_extract(`data`,'$.followup'),''), coalesce(json_extract(`data`,'$.collected'),0), coalesce(json_extract(`data`,'$.rewardRate'),0), `created`, `created` FROM `records` WHERE `kind`='deal';--> statement-breakpoint
INSERT OR IGNORE INTO `profiles` SELECT `owner`, CASE json_extract(`data`,'$.role') WHEN 'Owner' THEN 'Owner' WHEN 'Engineer' THEN 'Contributor' WHEN 'Builder' THEN 'Contributor' ELSE 'Business' END, json_extract(`data`,'$.name'), coalesce(json_extract(`data`,'$.organisation'),''), '', coalesce(json_extract(`data`,'$.licenseNumber'),''), coalesce(json_extract(`data`,'$.licenseAuthority'),''), coalesce(json_extract(`data`,'$.verification'),'Self-declared'), `created`, `created` FROM `records` WHERE `kind`='profile' ORDER BY `created` DESC;
