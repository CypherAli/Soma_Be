CREATE TABLE "medical_sources" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "year" INTEGER,
  "url" TEXT NOT NULL,
  "localFile" TEXT,
  "status" TEXT NOT NULL,
  "licenseNote" TEXT,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "medical_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pathology_citations" (
  "id" TEXT NOT NULL,
  "pathologyId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "pageOrSection" TEXT,
  "quote" TEXT,
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "verifiedBy" TEXT,
  "verifiedAt" TIMESTAMP(3),
  CONSTRAINT "pathology_citations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pathology_citations_pathologyId_idx" ON "pathology_citations"("pathologyId");
CREATE INDEX "pathology_citations_sourceId_idx" ON "pathology_citations"("sourceId");
CREATE UNIQUE INDEX "pathology_citations_pathologyId_sourceId_pageOrSection_key" ON "pathology_citations"("pathologyId", "sourceId", "pageOrSection");
ALTER TABLE "pathology_citations" ADD CONSTRAINT "pathology_citations_pathologyId_fkey" FOREIGN KEY ("pathologyId") REFERENCES "pathologies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pathology_citations" ADD CONSTRAINT "pathology_citations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "medical_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
