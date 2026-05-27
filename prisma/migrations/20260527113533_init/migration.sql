-- CreateEnum
CREATE TYPE "Level" AS ENUM ('junior', 'mid', 'senior');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('junior', 'mid', 'senior');

-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('quick', 'standard', 'deep_coaching');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('in_progress', 'completed', 'ended_early');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('conceptual', 'debugging', 'system_design', 'behavioral', 'tradeoff');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "level" "Level" NOT NULL DEFAULT 'mid',
    "targetRole" TEXT,
    "targetCompanyType" TEXT,
    "preferredTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "SessionMode" NOT NULL,
    "topics" TEXT[],
    "difficulty" "Difficulty" NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'in_progress',
    "overallScore" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "expectedPoints" TEXT[],
    "order" INTEGER NOT NULL,
    "seedQuestionId" TEXT,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "followUpAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnswerFeedback" (
    "id" TEXT NOT NULL,
    "answerId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "scoreCorrectness" INTEGER NOT NULL,
    "scoreCompleteness" INTEGER NOT NULL,
    "scoreClarity" INTEGER NOT NULL,
    "scoreDepth" INTEGER NOT NULL,
    "scoreTradeoffThinking" INTEGER NOT NULL,
    "scoreCommunication" INTEGER NOT NULL,
    "whatWentWell" TEXT[],
    "whatWasMissing" TEXT[],
    "technicalCorrections" TEXT[],
    "improvementSuggestions" TEXT[],
    "betterAnswer" TEXT NOT NULL,
    "seniorLevelAddition" TEXT,
    "recommendedNextPractice" TEXT[],
    "modelUsed" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnswerFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSummary" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "strongAreas" TEXT[],
    "weakAreas" TEXT[],
    "repeatedMistakes" TEXT[],
    "recommendedTopics" TEXT[],
    "actionItems" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeedQuestion" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "type" "QuestionType" NOT NULL,
    "question" TEXT NOT NULL,
    "expectedPoints" TEXT[],
    "followUps" TEXT[],
    "rubric" JSONB NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceFile" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICall" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "task" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "costUsd" DECIMAL(10,6) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "succeeded" BOOLEAN NOT NULL,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "InterviewSession_userId_startedAt_idx" ON "InterviewSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "InterviewQuestion_sessionId_order_idx" ON "InterviewQuestion"("sessionId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_questionId_key" ON "UserAnswer"("questionId");

-- CreateIndex
CREATE INDEX "UserAnswer_userId_createdAt_idx" ON "UserAnswer"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnswerFeedback_answerId_key" ON "AnswerFeedback"("answerId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionSummary_sessionId_key" ON "SessionSummary"("sessionId");

-- CreateIndex
CREATE INDEX "SeedQuestion_topic_difficulty_idx" ON "SeedQuestion"("topic", "difficulty");

-- CreateIndex
CREATE INDEX "AICall_userId_createdAt_idx" ON "AICall"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AICall_task_createdAt_idx" ON "AICall"("task", "createdAt");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnswerFeedback" ADD CONSTRAINT "AnswerFeedback_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "UserAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSummary" ADD CONSTRAINT "SessionSummary_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
