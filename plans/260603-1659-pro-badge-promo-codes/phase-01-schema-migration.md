---
phase: 1
title: "Schema Migration"
status: completed
effort: "1h"
dependencies: []
---

# Phase 1: Schema Migration

## Overview

Add `proExpiresAt` to `User`, plus two new tables: `PromoCode` and `PromoRedemption`. Run and apply the Prisma migration.

## Requirements

- **Functional:** New fields must be nullable/backward-compatible — existing users unaffected.
- **Non-functional:** Migration must be zero-downtime (all new columns nullable or have defaults).

## Architecture

```
User
  + proExpiresAt  DateTime?   -- null = permanent Pro (Polar subscriber); set = promo grant

PromoCode
  id            String   @id @default(cuid())
  code          String   @unique   -- e.g. "LAUNCH50", "BETA-7DAY"
  durationDays  Int               -- days of Pro access granted on redemption
  maxUses       Int               -- 0 = unlimited
  usedCount     Int      @default(0)
  expiresAt     DateTime?         -- null = code never expires
  note          String?           -- admin memo
  createdAt     DateTime @default(now())

PromoRedemption
  id           String   @id @default(cuid())
  promoCodeId  String
  userId       String
  grantedAt    DateTime @default(now())
  proExpiresAt DateTime           -- = grantedAt + durationDays

  promoCode  PromoCode @relation(fields: [promoCodeId], references: [id])
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([promoCodeId, userId])   -- one redemption per code per user
```

## Related Code Files

- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_pro_expiry_promo_codes/migration.sql` (auto-generated)

## Implementation Steps

1. Add to `model User` in `schema.prisma`:
   ```prisma
   proExpiresAt DateTime?
   redemptions  PromoRedemption[]
   ```

2. Add new models after `User`:
   ```prisma
   model PromoCode {
     id           String   @id @default(cuid())
     code         String   @unique
     durationDays Int
     maxUses      Int      @default(0)
     usedCount    Int      @default(0)
     expiresAt    DateTime?
     note         String?
     createdAt    DateTime @default(now())
     redemptions  PromoRedemption[]
   }

   model PromoRedemption {
     id           String   @id @default(cuid())
     promoCodeId  String
     userId       String
     grantedAt    DateTime @default(now())
     proExpiresAt DateTime

     promoCode  PromoCode @relation(fields: [promoCodeId], references: [id])
     user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@unique([promoCodeId, userId])
   }
   ```

3. Run: `pnpm prisma migrate dev --name pro_expiry_promo_codes`
4. Run: `pnpm prisma generate` to refresh the client types.
5. Verify: `pnpm prisma studio` shows new tables (optional sanity check).

## Success Criteria

- [ ] `prisma migrate dev` exits 0, migration SQL created
- [ ] `prisma generate` exits 0, `PromoCode` and `PromoRedemption` types available in `@prisma/client`
- [ ] Existing `User` rows unaffected (`proExpiresAt` null by default)
- [ ] `pnpm build` (type-check) passes after schema regeneration
