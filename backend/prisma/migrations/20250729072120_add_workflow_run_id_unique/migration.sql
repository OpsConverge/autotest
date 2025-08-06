/*
  Warnings:

  - A unique constraint covering the columns `[workflowRunId]` on the table `Build` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repoFullName` to the `Build` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workflowRunId` to the `Build` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Build" ADD COLUMN     "repoFullName" TEXT NOT NULL,
ADD COLUMN     "workflowRunId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Build_workflowRunId_key" ON "Build"("workflowRunId");
