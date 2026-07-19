-- CreateTable
CREATE TABLE "species" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "latin" TEXT,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anatomy_systems" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "latin" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "speciesId" TEXT NOT NULL,

    CONSTRAINT "anatomy_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "structures" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "meshName" TEXT,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "latin" TEXT,
    "taCode" TEXT,
    "descriptionVi" TEXT,
    "descriptionEn" TEXT,
    "descriptionZh" TEXT,
    "systemId" TEXT NOT NULL,
    "speciesId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathologies" (
    "id" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL,
    "latin" TEXT,
    "icdCode" TEXT,
    "severity" TEXT,
    "descriptionVi" TEXT,
    "source" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,

    CONSTRAINT "pathologies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" TEXT NOT NULL,
    "promptVi" TEXT NOT NULL,
    "promptEn" TEXT NOT NULL,
    "promptZh" TEXT NOT NULL,
    "explanation" TEXT,
    "source" TEXT,
    "systemId" TEXT NOT NULL,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_options" (
    "id" TEXT NOT NULL,
    "textVi" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textZh" TEXT NOT NULL,
    "latin" TEXT,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "titleVi" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT NOT NULL,
    "authorName" TEXT,
    "authorRole" TEXT,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "coverColor" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "species_code_key" ON "species"("code");

-- CreateIndex
CREATE UNIQUE INDEX "anatomy_systems_code_key" ON "anatomy_systems"("code");

-- CreateIndex
CREATE UNIQUE INDEX "structures_code_key" ON "structures"("code");

-- CreateIndex
CREATE INDEX "structures_systemId_idx" ON "structures"("systemId");

-- CreateIndex
CREATE INDEX "structures_parentId_idx" ON "structures"("parentId");

-- CreateIndex
CREATE INDEX "pathologies_structureId_idx" ON "pathologies"("structureId");

-- CreateIndex
CREATE INDEX "quiz_questions_systemId_idx" ON "quiz_questions"("systemId");

-- CreateIndex
CREATE INDEX "quiz_options_questionId_idx" ON "quiz_options"("questionId");

-- AddForeignKey
ALTER TABLE "anatomy_systems" ADD CONSTRAINT "anatomy_systems_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "anatomy_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "structures" ADD CONSTRAINT "structures_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pathologies" ADD CONSTRAINT "pathologies_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "anatomy_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_options" ADD CONSTRAINT "quiz_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
