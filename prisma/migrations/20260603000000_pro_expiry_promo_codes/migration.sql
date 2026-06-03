-- Migration: pro_expiry_promo_codes
-- Adds proExpiresAt to User (for timed promo grants),
-- and two new tables: PromoCode and PromoRedemption.

-- User.proExpiresAt: null = permanent Pro (Polar subscriber); set = promo grant
ALTER TABLE "User" ADD COLUMN "proExpiresAt" TIMESTAMP(3);

-- Promo codes issued by admin
CREATE TABLE "PromoCode" (
    "id"           TEXT NOT NULL,
    "code"         TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "maxUses"      INTEGER NOT NULL DEFAULT 0,
    "usedCount"    INTEGER NOT NULL DEFAULT 0,
    "expiresAt"    TIMESTAMP(3),
    "note"         TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- One redemption per code per user
CREATE TABLE "PromoRedemption" (
    "id"           TEXT NOT NULL,
    "promoCodeId"  TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "grantedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proExpiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoRedemption_promoCodeId_userId_key" ON "PromoRedemption"("promoCodeId", "userId");

ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PromoRedemption" ADD CONSTRAINT "PromoRedemption_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
