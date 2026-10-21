ALTER TABLE "personal_questions"
  ADD COLUMN "answers" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "number" INTEGER,
  ADD COLUMN "sequence" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "context" TEXT,
  ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "explanationImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "reviewNote" TEXT;

UPDATE "personal_questions" SET "answers" = ARRAY["answer"]
WHERE "answer" ~ '^[A-F]$';
