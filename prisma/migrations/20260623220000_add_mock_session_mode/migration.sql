-- Add 'mock' value to SessionMode enum for exam-simulation sessions
-- (no live feedback during the session; all scoring revealed at the end).
-- PostgreSQL only allows adding enum values, not removing them.
ALTER TYPE "SessionMode" ADD VALUE IF NOT EXISTS 'mock';
