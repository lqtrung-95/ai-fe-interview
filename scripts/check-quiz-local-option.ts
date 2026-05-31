import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local', quiet: true });
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
async function main() {
  // Find the quiz whose options include "Local", "Store", URL state — these are visible in the screenshot
  const all = await prisma.seedQuestion.findMany({
    where: { quiz: { contains: '"Local"' } },
    select: { id: true, quiz: true },
  });
  for (const q of all) {
    const parsed = JSON.parse(q.quiz as string) as { question?: string; options?: string[] };
    console.log('ID:', q.id);
    console.log('question:', JSON.stringify(parsed.question));
    console.log('options:', parsed.options?.slice(0, 2));
    console.log();
  }
  console.log(`Total: ${all.length}`);
}
main().finally(() => prisma.$disconnect());
