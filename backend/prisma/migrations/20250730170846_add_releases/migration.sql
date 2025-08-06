-- AlterTable
ALTER TABLE "Build" ADD COLUMN     "releaseId" INTEGER;

-- CreateTable
CREATE TABLE "Release" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "tagName" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "commitHash" TEXT NOT NULL,
    "isPrerelease" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Release_teamId_tagName_key" ON "Release"("teamId", "tagName");

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "Release"("id") ON DELETE SET NULL ON UPDATE CASCADE;
