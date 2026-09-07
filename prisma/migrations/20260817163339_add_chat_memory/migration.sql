-- CreateTable
CREATE TABLE "chat_memory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "turns" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_memory_userId_key" ON "chat_memory"("userId");

-- AddForeignKey
ALTER TABLE "chat_memory" ADD CONSTRAINT "chat_memory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
