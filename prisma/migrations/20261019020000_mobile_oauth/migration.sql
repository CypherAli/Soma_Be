ALTER TABLE "oauth_states"
  ADD COLUMN "mobileChallenge" TEXT,
  ADD COLUMN "mobileState" TEXT,
  ADD COLUMN "callbackUrl" TEXT;

CREATE TABLE "mobile_oauth_codes" (
  "codeHash" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "challenge" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "mobile_oauth_codes_expiresAt_idx" ON "mobile_oauth_codes"("expiresAt");
