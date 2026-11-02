DO $$ BEGIN
  CREATE TYPE "schedule_shift_type" AS ENUM('MORNING', 'AFTERNOON', 'NIGHT', 'FULLDAY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "schedule_status" AS ENUM('SCHEDULED', 'ON_DUTY', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"shift_type" "schedule_shift_type" NOT NULL,
	"shift_name" varchar(100) NOT NULL,
	"date" varchar(10) NOT NULL,
	"start_time" varchar(10) NOT NULL,
	"end_time" varchar(10) NOT NULL,
	"status" "schedule_status" DEFAULT 'SCHEDULED'::"schedule_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_date_idx" ON "schedules" ("date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_user_id_idx" ON "schedules" ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_status_idx" ON "schedules" ("status");
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'schedules_user_id_users_id_fkey'
  ) THEN
    ALTER TABLE "schedules" ADD CONSTRAINT "schedules_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;
