CREATE TYPE "cash_movement_type" AS ENUM ('IN', 'OUT');
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"opening_cash" numeric(10, 2) NOT NULL,
	"expected_cash" numeric(10, 2),
	"closing_cash" numeric(10, 2),
	"cash_difference" numeric(10, 2),
	"opened_at" timestamp with time zone NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "cash_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL REFERENCES "shifts"("id"),
	"type" "cash_movement_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" varchar,
	"created_at" timestamp with time zone NOT NULL
);
