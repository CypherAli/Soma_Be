BEGIN;
ALTER TABLE "users" ADD COLUMN "passwordEmail" TEXT;
UPDATE "users" SET "passwordEmail" = lower(btrim("email")) WHERE "passwordHash" IS NOT NULL;
CREATE UNIQUE INDEX "users_passwordEmail_key" ON "users"("passwordEmail");
DROP INDEX "users_email_key";
CREATE INDEX "users_email_idx" ON "users"("email");
COMMIT;
