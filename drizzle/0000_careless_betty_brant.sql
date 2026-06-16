CREATE TABLE `matches` (
	`id` integer PRIMARY KEY NOT NULL,
	`utc_date` text NOT NULL,
	`status` text NOT NULL,
	`stage` text,
	`group_name` text,
	`matchday` integer,
	`home_team_name` text NOT NULL,
	`home_team_code` text,
	`home_team_crest` text,
	`away_team_name` text NOT NULL,
	`away_team_code` text,
	`away_team_crest` text,
	`ft_home` integer,
	`ft_away` integer,
	`winner` text,
	`duration` text,
	`pen_home` integer,
	`pen_away` integer,
	`manual_override` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tips` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`participant_id` integer NOT NULL,
	`match_id` integer NOT NULL,
	`home_goals` integer NOT NULL,
	`away_goals` integer NOT NULL,
	`points` integer,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_participant_match` ON `tips` (`participant_id`,`match_id`);