/**
 * Clears all user activity data while preserving:
 *   - User accounts
 *   - SeedQuestion reference data
 *
 * Deletes in dependency order to avoid FK constraint errors.
 *
 * Run:  pnpm db:clear-activity
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🗑️  Clearing user activity data...\n');

  const results = await prisma.$transaction([
    prisma.aICall.deleteMany(),
    prisma.answerFeedback.deleteMany(),
    prisma.sessionSummary.deleteMany(),
    prisma.userAnswer.deleteMany(),
    prisma.interviewQuestion.deleteMany(),
    prisma.interviewSession.deleteMany(),
    prisma.studyPlanProgress.deleteMany(),
    prisma.studyPlan.deleteMany(),
  ]);

  const [aiCalls, feedback, summaries, answers, questions, sessions, progress, plans] = results;

  console.log(`  ✓ AICall             ${aiCalls.count} rows`);
  console.log(`  ✓ AnswerFeedback     ${feedback.count} rows`);
  console.log(`  ✓ SessionSummary     ${summaries.count} rows`);
  console.log(`  ✓ UserAnswer         ${answers.count} rows`);
  console.log(`  ✓ InterviewQuestion  ${questions.count} rows`);
  console.log(`  ✓ InterviewSession   ${sessions.count} rows`);
  console.log(`  ✓ StudyPlanProgress  ${progress.count} rows`);
  console.log(`  ✓ StudyPlan          ${plans.count} rows`);

  console.log('\n✅ Done. Users and SeedQuestions untouched.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
