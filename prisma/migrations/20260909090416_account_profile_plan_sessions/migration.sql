-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('free', 'pro');

-- AlterTable
ALTER TABLE "oauth_states" ADD COLUMN     "linkUserId" TEXT;

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAgent" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "plan" "UserPlan" NOT NULL DEFAULT 'free';
