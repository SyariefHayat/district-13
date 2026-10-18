CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "action" varchar(100) NOT NULL,
  "entity_type" varchar(100) NOT NULL,
  "entity_id" uuid,
  "description" varchar(255) NOT NULL,
  "metadata" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");
CREATE INDEX "audit_logs_user_created_idx" ON "audit_logs" ("user_id", "created_at");
CREATE INDEX "audit_logs_entity_created_idx" ON "audit_logs" ("entity_type", "entity_id", "created_at");
CREATE INDEX "audit_logs_action_created_idx" ON "audit_logs" ("action", "created_at");
REVOKE UPDATE, DELETE ON TABLE "audit_logs" FROM PUBLIC;
