CREATE TABLE IF NOT EXISTS "auth_login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username_key" varchar(64) NOT NULL,
	"ip_key" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_login_attempts_username_created_idx" ON "auth_login_attempts" USING btree ("username_key", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "auth_login_attempts_ip_created_idx" ON "auth_login_attempts" USING btree ("ip_key", "created_at");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"event" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.table_constraints
		WHERE table_schema = 'public'
		AND table_name = 'auth_audit_logs'
		AND constraint_name = 'auth_audit_logs_user_id_users_id_fk'
	) THEN
		ALTER TABLE "auth_audit_logs"
			ADD CONSTRAINT "auth_audit_logs_user_id_users_id_fk"
			FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
			ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
