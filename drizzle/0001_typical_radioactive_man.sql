ALTER TABLE "daily_targets" ADD COLUMN "fat_g_training" integer;--> statement-breakpoint
ALTER TABLE "daily_targets" ADD COLUMN "source" text DEFAULT 'calibration';