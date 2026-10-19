ALTER TABLE "quiz_attempts"
ADD COLUMN "clientRequestId" TEXT,
ADD COLUMN "requestFingerprint" TEXT;

CREATE UNIQUE INDEX "quiz_attempts_userId_clientRequestId_key"
ON "quiz_attempts"("userId", "clientRequestId");
