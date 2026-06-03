import 'server-only';
import type { ExtractJdInput } from '@/features/interview/ai-schemas';
import { sanitize } from '../sanitize';

export function buildJdExtractPrompt(input: ExtractJdInput): { system: string; user: string } {
  const system = [
    'You are a job description analyst. Extract structured data from the provided job posting.',
    'Fields to extract:',
    '- role: exact job title from the posting',
    '- company: company name if explicitly mentioned, else omit',
    '- level: inferred seniority (junior/mid/senior/staff) based on requirements, else omit',
    '- domain: business domain in 3–5 words (e.g. "fintech / payments", "e-commerce / B2C")',
    '- requiredStack: up to 10 explicitly required technologies or frameworks',
    '- signals: up to 6 short culture or working-style keywords (e.g. "high-ownership", "distributed-systems")',
    'Output strict JSON. Omit optional fields when they cannot be reliably inferred.',
  ].join('\n');

  const user = sanitize(input.rawJd, 6000);

  return { system, user };
}
