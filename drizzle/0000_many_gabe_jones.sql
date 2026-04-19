CREATE TABLE "check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"weight_kg" numeric,
	"energy_level" integer,
	"recovery_score" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coach_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_date" date NOT NULL,
	"messages_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coach_conversations_user_id_session_date_unique" UNIQUE("user_id","session_date")
);
--> statement-breakpoint
CREATE TABLE "daily_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"effective_date" date NOT NULL,
	"protein_g" integer NOT NULL,
	"carbs_g_training" integer NOT NULL,
	"carbs_g_rest" integer NOT NULL,
	"fat_g" integer NOT NULL,
	"calories_training" integer NOT NULL,
	"calories_rest" integer NOT NULL,
	"rationale" text,
	"source_scan_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daily_targets_user_id_effective_date_unique" UNIQUE("user_id","effective_date")
);
--> statement-breakpoint
CREATE TABLE "food_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"logged_at" timestamp NOT NULL,
	"meal_name" text NOT NULL,
	"foods" jsonb NOT NULL,
	"total_calories" integer NOT NULL,
	"total_protein_g" integer NOT NULL,
	"total_carbs_g" integer NOT NULL,
	"total_fat_g" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbody_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scan_date" date NOT NULL,
	"weight_kg" numeric(5, 2) NOT NULL,
	"muscle_mass_kg" numeric(5, 2) NOT NULL,
	"body_fat_percent" numeric(5, 2) NOT NULL,
	"body_fat_mass_kg" numeric(5, 2) NOT NULL,
	"visceral_fat" integer NOT NULL,
	"pdf_path" text,
	"parsed_confidence" text NOT NULL,
	"flagged_fields" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"is_training_day" boolean NOT NULL,
	"raw_input" text NOT NULL,
	"estimated_protein_g" numeric(6, 1),
	"estimated_carbs_g" numeric(6, 1),
	"estimated_fat_g" numeric(6, 1),
	"estimated_calories" integer,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrition_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"calories" integer NOT NULL,
	"protein_g" integer NOT NULL,
	"carbs_g" integer NOT NULL,
	"fat_g" integer NOT NULL,
	"meals" jsonb NOT NULL,
	"ai_generated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"age" integer,
	"weight_kg" numeric,
	"height_cm" numeric,
	"sport" text,
	"training_days_per_week" integer,
	"goal" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_training_day" boolean DEFAULT false NOT NULL,
	"training_type" text,
	"duration_min" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "training_schedule_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"plan_json" jsonb NOT NULL,
	"grocery_list_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_plans_user_id_week_start_unique" UNIQUE("user_id","week_start")
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_logs" ADD CONSTRAINT "food_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;