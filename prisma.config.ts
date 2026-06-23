import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load Next.js-style env files in the same order Next.js does.
loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

/**
 * Prisma 7 moved connection URL out of schema.prisma. CLI commands
 * (`prisma migrate`, `prisma db push`, `prisma studio`) read it from here;
 * runtime PrismaClient uses the pg driver adapter (see src/lib/db/client.ts).
 *
 * Applying migrations: the simplest path is the Supabase Dashboard → SQL Editor
 * (paste the migration .sql and run). For the CLI, point DIRECT_URL at the
 * Supabase "Session pooler" string — same host/credentials as DATABASE_URL but
 * port 5432 and no ?pgbouncer flag (Settings → Database → Session pooler).
 * NOTE: the legacy "Direct connection" host db.<ref>.supabase.co was retired
 * and no longer resolves; use the Session pooler, not the direct host.
 *
 * Production deployments (Vercel) run `prisma generate` only — migrations are
 * applied manually via the SQL editor, so DATABASE_URL (transaction pooler) is
 * fine here.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // DIRECT_URL is the non-pooled Supabase connection (port 5432) required for
    // migrate/db push. Falls back to DATABASE_URL (pooler) when not set (e.g. Vercel).
    // Use process.env directly — env() throws on missing vars, which breaks Vercel build.
    url: process.env.DIRECT_URL ?? env('DATABASE_URL'),
  },
});
