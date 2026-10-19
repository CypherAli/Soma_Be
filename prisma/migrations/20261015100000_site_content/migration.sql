CREATE TABLE "site_content" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "draft" JSONB NOT NULL,
  "published" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "publishedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "site_content_revisions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "contentId" TEXT NOT NULL REFERENCES "site_content"("id") ON DELETE CASCADE,
  "version" INTEGER NOT NULL,
  "payload" JSONB NOT NULL,
  "action" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("contentId", "version")
);
CREATE TABLE "site_content_previews" (
  "tokenHash" TEXT NOT NULL PRIMARY KEY,
  "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "site_content_previews_expiresAt_idx" ON "site_content_previews"("expiresAt");
CREATE TABLE "site_assets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "filename" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "bytes" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "meshNames" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
