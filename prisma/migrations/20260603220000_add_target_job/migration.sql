-- CreateTable
CREATE TABLE "TargetJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rawJd" TEXT NOT NULL,
    "jdContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TargetJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TargetJob_userId_idx" ON "TargetJob"("userId");

-- AddForeignKey
ALTER TABLE "TargetJob" ADD CONSTRAINT "TargetJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN "label" TEXT,
ADD COLUMN "targetJobId" TEXT;

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_targetJobId_fkey" FOREIGN KEY ("targetJobId") REFERENCES "TargetJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Enable RLS (service_role used by Prisma has BYPASSRLS — no policies needed)
ALTER TABLE "TargetJob" ENABLE ROW LEVEL SECURITY;
