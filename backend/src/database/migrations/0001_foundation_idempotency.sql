CREATE TABLE IF NOT EXISTS "idempotency_records" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scope" text NOT NULL,
  "key" text NOT NULL,
  "request_hash" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "response" jsonb,
  "status_code" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "idempotency_records" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "idempotency_records" ALTER COLUMN "response" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "idempotency_records" ALTER COLUMN "status_code" DROP NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_scope_key_unique" ON "idempotency_records" USING btree ("scope", "key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idempotency_expires_idx" ON "idempotency_records" USING btree ("expires_at");
