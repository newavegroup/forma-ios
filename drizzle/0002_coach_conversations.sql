CREATE TABLE IF NOT EXISTS "coach_conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "session_date" date NOT NULL,
  "messages_json" jsonb NOT NULL DEFAULT '[]',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "coach_conversations_user_id_session_date_unique" UNIQUE("user_id","session_date")
);
