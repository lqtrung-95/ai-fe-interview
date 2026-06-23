-- Add hasLifetimePlan flag to User.
-- Lifetime buyers (order.paid) get this set to true so that a later
-- subscription cancellation does not revoke their Pro access.
ALTER TABLE "User" ADD COLUMN "hasLifetimePlan" BOOLEAN NOT NULL DEFAULT false;
