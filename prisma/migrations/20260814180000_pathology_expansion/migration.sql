-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('info', 'warning', 'critical');

-- DropForeignKey
ALTER TABLE "pathologies" DROP CONSTRAINT "pathologies_structureId_fkey";

-- AlterTable
ALTER TABLE "pathologies" DROP COLUMN "descriptionVi",
ADD COLUMN     "clinicalSystem" TEXT,
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "sourcePage" INTEGER,
DROP COLUMN "severity",
ADD COLUMN     "severity" "Severity",
ALTER COLUMN "structureId" DROP NOT NULL;

-- Backfill slug cho các dòng có sẵn rồi mới siết NOT NULL (seed sẽ upsert đè lên
-- bằng slug thật; đặt tạm theo id để không đụng dữ liệu và không mất bản ghi).
UPDATE "pathologies" SET "slug" = 'legacy-' || "id" WHERE "slug" IS NULL;
ALTER TABLE "pathologies" ALTER COLUMN "slug" SET NOT NULL;

-- CreateTable
CREATE TABLE "pathology_structures" (
    "pathologyId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,

    CONSTRAINT "pathology_structures_pkey" PRIMARY KEY ("pathologyId","structureId")
);

-- CreateTable
CREATE TABLE "pathology_content" (
    "id" TEXT NOT NULL,
    "pathologyId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "description" TEXT,
    "clinical" TEXT,
    "imaging" TEXT,
    "progression" TEXT,
    "treatment" TEXT,

    CONSTRAINT "pathology_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pathology_structures_structureId_idx" ON "pathology_structures"("structureId");

-- CreateIndex
CREATE INDEX "pathology_content_pathologyId_idx" ON "pathology_content"("pathologyId");

-- CreateIndex
CREATE UNIQUE INDEX "pathology_content_pathologyId_locale_key" ON "pathology_content"("pathologyId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "pathologies_slug_key" ON "pathologies"("slug");

-- CreateIndex
CREATE INDEX "pathologies_clinicalSystem_idx" ON "pathologies"("clinicalSystem");

-- AddForeignKey
ALTER TABLE "pathologies" ADD CONSTRAINT "pathologies_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathology_structures" ADD CONSTRAINT "pathology_structures_pathologyId_fkey" FOREIGN KEY ("pathologyId") REFERENCES "pathologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathology_structures" ADD CONSTRAINT "pathology_structures_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathology_content" ADD CONSTRAINT "pathology_content_pathologyId_fkey" FOREIGN KEY ("pathologyId") REFERENCES "pathologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

