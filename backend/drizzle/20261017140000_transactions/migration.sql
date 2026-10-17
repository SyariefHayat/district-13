CREATE TYPE "transaction_payment_method" AS ENUM ('CASH', 'QRIS');
--> statement-breakpoint
CREATE TYPE "transaction_status" AS ENUM ('VALID', 'VOID');
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid NOT NULL REFERENCES "shifts"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"payment_method" "transaction_payment_method" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'VALID' NOT NULL,
	"voided_by" uuid REFERENCES "users"("id"),
	"voided_at" timestamp with time zone,
	"cash_refund" numeric(10, 2),
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "transactions_shift_valid_cash_idx"
	ON "transactions" ("shift_id")
	WHERE "status" = 'VALID' AND "payment_method" = 'CASH';
