-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "userId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("userId","teamId")
);

-- CreateTable
CREATE TABLE "TeamSettings" (
    "teamId" INTEGER NOT NULL,
    "settings" JSONB NOT NULL,

    CONSTRAINT "TeamSettings_pkey" PRIMARY KEY ("teamId")
);

-- CreateTable
CREATE TABLE "GithubToken" (
    "teamId" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,

    CONSTRAINT "GithubToken_pkey" PRIMARY KEY ("teamId")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "commitHash" TEXT NOT NULL,
    "commitMessage" TEXT,
    "author" TEXT,
    "status" TEXT NOT NULL,
    "totalTests" INTEGER,
    "passedTests" INTEGER,
    "failedTests" INTEGER,
    "flakyTests" INTEGER,
    "coveragePercentage" DOUBLE PRECISION,
    "buildDuration" DOUBLE PRECISION,
    "environment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestRun" (
    "id" SERIAL NOT NULL,
    "buildId" INTEGER NOT NULL,
    "testSuite" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" DOUBLE PRECISION,
    "coveragePercentage" DOUBLE PRECISION,
    "errorMessage" TEXT,
    "stackTrace" TEXT,
    "screenshotUrl" TEXT,
    "aiAnalysis" JSONB,
    "executionTrigger" TEXT,
    "environment" TEXT,
    "branch" TEXT,
    "commitHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSettings" ADD CONSTRAINT "TeamSettings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GithubToken" ADD CONSTRAINT "GithubToken_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
