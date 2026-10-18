ALTER TABLE "shifts"
	ALTER COLUMN "opened_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "cash_movements"
	ALTER COLUMN "created_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "cash_movements"
	DROP COLUMN "recorded_by_estimated";
--> statement-breakpoint
ALTER TABLE "shifts"
	ADD CONSTRAINT "shifts_opening_cash_nonnegative" CHECK ("opening_cash" >= 0);
--> statement-breakpoint
ALTER TABLE "shifts"
	ADD CONSTRAINT "shifts_closed_fields_consistent" CHECK (
		("closed_at" IS NULL AND "closing_cash" IS NULL AND "expected_cash" IS NULL AND "cash_difference" IS NULL AND "closed_by" IS NULL)
		OR
		("closed_at" IS NOT NULL AND "closing_cash" IS NOT NULL AND "expected_cash" IS NOT NULL AND "cash_difference" IS NOT NULL AND "closed_by" IS NOT NULL)
	);
--> statement-breakpoint
ALTER TABLE "cash_movements"
	ADD CONSTRAINT "cash_movements_amount_positive" CHECK ("amount" > 0);
--> statement-breakpoint
ALTER TABLE "transactions"
	RENAME COLUMN "amount" TO "total_amount";
--> statement-breakpoint
ALTER INDEX "transactions_shift_valid_cash_idx"
	RENAME TO "transactions_shift_completed_cash_idx";
--> statement-breakpoint
ALTER TYPE "transaction_status" RENAME VALUE 'VALID' TO 'COMPLETED';
--> statement-breakpoint
ALTER TYPE "transaction_status" RENAME VALUE 'VOID' TO 'VOIDED';
--> statement-breakpoint
ALTER TABLE "transactions"
	ALTER COLUMN "status" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "transactions"
	DROP COLUMN "cash_refund";
