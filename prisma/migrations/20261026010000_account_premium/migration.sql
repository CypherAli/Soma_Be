ALTER TABLE "users" ADD COLUMN "learningRole" TEXT NOT NULL DEFAULT 'learner',
ADD COLUMN "premiumUntil" TIMESTAMP(3);
ALTER TABLE "users" ADD CONSTRAINT "users_learning_role_check" CHECK ("learningRole" IN ('learner','teacher'));
CREATE TABLE "assistant_usage" (
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "month" TEXT NOT NULL,
  "used" INTEGER NOT NULL DEFAULT 0 CHECK ("used" >= 0),
  PRIMARY KEY ("userId", "month")
);
CREATE TABLE "premium_orders" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "amount" INTEGER NOT NULL DEFAULT 25000 CHECK ("amount" = 25000),
  "status" TEXT NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending','paid')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paidAt" TIMESTAMP(3),
  "transactionId" TEXT UNIQUE
);
CREATE INDEX "premium_orders_userId_createdAt_idx" ON "premium_orders"("userId", "createdAt");
CREATE UNIQUE INDEX "premium_orders_one_pending_per_user" ON "premium_orders"("userId") WHERE "status" = 'pending';
