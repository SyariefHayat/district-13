DO $$
BEGIN
	CREATE TYPE "user_role" AS ENUM ('OWNER', 'ADMIN', 'CASHIER');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" varchar(60) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"refresh_token_hash" varchar(255) NOT NULL UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'refresh_token'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'refresh_token_hash'
	) THEN
		DELETE FROM "sessions";
		ALTER TABLE "sessions" RENAME COLUMN "refresh_token" TO "refresh_token_hash";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash'
	) THEN
		ALTER TABLE "users" RENAME COLUMN "password" TO "password_hash";
	END IF;

	IF EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE table_schema = 'public' AND table_name = 'sessions'
		AND constraint_name = 'sessions_refresh_token_key'
	) AND NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE table_schema = 'public' AND table_name = 'sessions'
		AND constraint_name = 'sessions_refresh_token_hash_key'
	) THEN
		ALTER TABLE "sessions" RENAME CONSTRAINT "sessions_refresh_token_key" TO "sessions_refresh_token_hash_key";
	END IF;
END $$;
