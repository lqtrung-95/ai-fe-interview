/**
 * Admin CLI: create or update a promo code in the database.
 *
 * Usage:
 *   pnpm tsx scripts/create-promo-code.ts --code LAUNCH7 --days 7
 *   pnpm tsx scripts/create-promo-code.ts --code BETA30 --days 30 --max-uses 50 --note "Beta testers"
 *   pnpm tsx scripts/create-promo-code.ts --code GIFT14 --days 14 --expires 2026-12-31
 *
 * Flags:
 *   --code        (required) Code string — stored uppercase
 *   --days        (required) Days of Pro access granted
 *   --max-uses    Max redemptions; 0 = unlimited (default: 0)
 *   --expires     ISO date when the code itself stops working (default: never)
 *   --note        Admin memo
 */

import { config as loadEnv } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

loadEnv({ path: '.env.local' });

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const get = (flag: string): string | undefined => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : undefined;
};

const rawCode = get('--code');
const rawDays = get('--days');
const rawMaxUses = get('--max-uses');
const rawExpires = get('--expires');
const note = get('--note') ?? null;

if (!rawCode || !rawDays) {
  console.error('Usage: pnpm tsx scripts/create-promo-code.ts --code CODE --days N [--max-uses N] [--expires YYYY-MM-DD] [--note "memo"]');
  process.exit(1);
}

const code = rawCode.trim().toUpperCase();
const durationDays = parseInt(rawDays, 10);
const maxUses = rawMaxUses ? parseInt(rawMaxUses, 10) : 0;
// Parse as midnight UTC to avoid local-timezone shifting (e.g. "2026-12-31" → Dec 30 in UTC+7)
const expiresAt = rawExpires ? new Date(`${rawExpires}T00:00:00.000Z`) : null;

if (isNaN(durationDays) || durationDays < 1) {
  console.error('--days must be a positive integer');
  process.exit(1);
}
if (isNaN(maxUses) || maxUses < 0) {
  console.error('--max-uses must be a non-negative integer (0 = unlimited)');
  process.exit(1);
}

// ── Connect + upsert ──────────────────────────────────────────────────────────

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const result = await prisma.promoCode.upsert({
    where: { code },
    create: { code, durationDays, maxUses, expiresAt, note },
    update: { durationDays, maxUses, expiresAt, note },
  });

  console.log('\n✓ Promo code saved:');
  console.log(`  code:         ${result.code}`);
  console.log(`  durationDays: ${result.durationDays}`);
  console.log(`  maxUses:      ${result.maxUses === 0 ? 'unlimited' : result.maxUses}`);
  console.log(`  usedCount:    ${result.usedCount}`);
  console.log(`  expiresAt:    ${result.expiresAt ? result.expiresAt.toISOString().split('T')[0] : 'never'}`);
  console.log(`  note:         ${result.note ?? '—'}`);
  console.log(`  id:           ${result.id}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
