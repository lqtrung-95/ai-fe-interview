-- Add 'coding' value to QuestionType enum for live-coding / implementation questions.
-- PostgreSQL only allows adding enum values, not removing them.
ALTER TYPE "QuestionType" ADD VALUE 'coding';
