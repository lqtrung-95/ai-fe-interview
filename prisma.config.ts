import { config as loadEnv } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Load Next.js-style env files in the same order Next.js does.
loadEnv({ path: '.env.local', quiet: true });
loadEnv({ path: '.env', quiet: true });

/**
 * Prisma 7 moved connection URL out of schema.prisma. CLI commands
 * (`prisma migrate`, `prisma db push`, `prisma studio`) read it from here;
 * runtime PrismaClient uses the pg driver adapter (see src/lib/db/client.ts).
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
