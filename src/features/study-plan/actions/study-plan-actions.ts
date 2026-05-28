'use server';

import { revalidatePath } from 'next/cache';
import type { Level } from '@prisma/client';
import { requireUser } from '@/lib/auth/session';
import { upsertStudyPlan, toggleStudied } from '../server/study-plan-service';

const VALID_LEVELS: Level[] = ['junior', 'mid', 'senior', 'staff'];
const VALID_PREP_WEEKS = [1, 2, 4, 12];
const CANONICAL_TOPICS = [
  'JavaScript',
  'React',
  'Frontend System Design',
  'Web Performance',
  'Browser & Web APIs',
  'Testing',
  'Behavioral',
];

export async function savePlanAction(formData: FormData) {
  const user = await requireUser();

  // Parse + validate topics (sent as repeated "topic" fields).
  const topics = formData.getAll('topic').filter((v): v is string => typeof v === 'string' && CANONICAL_TOPICS.includes(v));
  if (topics.length === 0) throw new Error('Select at least one topic.');

  const level = formData.get('level') as Level;
  if (!VALID_LEVELS.includes(level)) throw new Error('Invalid level.');

  const prepWeeks = Number(formData.get('prepWeeks'));
  if (!VALID_PREP_WEEKS.includes(prepWeeks)) throw new Error('Invalid prep duration.');

  await upsertStudyPlan(user.id, { topics, level, prepWeeks });
  revalidatePath('/study-plan');
}

export async function toggleStudiedAction(seedQuestionId: string): Promise<boolean> {
  const user = await requireUser();
  const isNowStudied = await toggleStudied(user.id, seedQuestionId);
  revalidatePath('/study-plan');
  revalidatePath(`/question-bank/${seedQuestionId}`);
  return isNowStudied;
}
