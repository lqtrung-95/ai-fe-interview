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
 * Migration commands need a direct (non-pooled) connection — PgBouncer in
 * transaction mode does not support the advisory locks Prisma migrate uses.
 * Set DIRECT_URL in .env.local to the Supabase "Direct connection" string:
 *   Project Settings → Database → Connection String → URI  (port 5432, no pgbouncer)
 * Falls back to DATABASE_URL when DIRECT_URL is absent.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DIRECT_URL') || env('DATABASE_URL'),
  },
});
