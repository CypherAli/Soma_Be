ALTER TABLE "users" ADD COLUMN "sandboxPremiumUntil" TIMESTAMP(3);
ALTER TABLE "premium_orders" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'bank-webhook';
ALTER TABLE "premium_orders" ADD CONSTRAINT "premium_orders_provider_check" CHECK ("provider" IN ('bank-webhook','sepay-sandbox','sepay-production'));
DROP INDEX "premium_orders_one_pending_per_user";
CREATE UNIQUE INDEX "premium_orders_one_pending_per_provider" ON "premium_orders"("userId", "provider") WHERE "status" = 'pending';
