-- Add 'kind' to CodingChallenge to distinguish classic function challenges
-- (run in the Node vm executor) from component challenges (built + graded
-- client-side in a sandboxed iframe with axe-core).
ALTER TABLE "CodingChallenge" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'function';
