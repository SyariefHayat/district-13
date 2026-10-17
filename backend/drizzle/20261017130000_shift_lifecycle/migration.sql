ALTER TABLE "shifts"
	ADD COLUMN "closed_by" uuid REFERENCES "users"("id");
--> statement-breakpoint
ALTER TABLE "cash_movements"
	ADD COLUMN "recorded_by" uuid REFERENCES "users"("id");
--> statement-breakpoint
UPDATE "cash_movements" AS movement
SET "recorded_by" = shift."user_id"
FROM "shifts" AS shift
WHERE movement."shift_id" = shift."id";
--> statement-breakpoint
ALTER TABLE "cash_movements"
	ALTER COLUMN "recorded_by" SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_one_active_per_user"
	ON "shifts" ("user_id")
	WHERE "closed_at" IS NULL;
--> statement-breakpoint
CREATE INDEX "shifts_opened_at_idx" ON "shifts" ("opened_at");
