import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

// Stub all AI SDK providers — we only care about tier/task mapping, not real models
const stubModel = (id: string) => ({ __stub: id });
vi.mock('@ai-sdk/groq', () => ({ groq: (id: string) => stubModel(`groq:${id}`) }));
vi.mock('@ai-sdk/openai', () => ({ openai: (id: string) => stubModel(`openai:${id}`) }));
vi.mock('@ai-sdk/anthropic', () => ({ anthropic: (id: string) => stubModel(`anthropic:${id}`) }));
vi.mock('@ai-sdk/deepseek', () => ({ deepseek: (id: string) => stubModel(`deepseek:${id}`) }));

import { routeModel } from './model-router';

describe('routeModel — task → tier mapping', () => {
  const cheapTasks = ['generate_question', 'generate_followup', 'extract_jd'] as const;
  const smartTasks = ['evaluate_answer', 'generate_summary'] as const;

  it.each(cheapTasks)('%s routes to the cheap tier', (task) => {
    const { tier } = routeModel(task);
    expect(tier).toBe('cheap');
  });

  it.each(smartTasks)('%s routes to the smart tier', (task) => {
    const { tier } = routeModel(task);
    expect(tier).toBe('smart');
  });

  it('returns a model and modelId for every task type', () => {
    const allTasks = [...cheapTasks, ...smartTasks] as const;
    for (const task of allTasks) {
      const result = routeModel(task);
      expect(result.model).toBeDefined();
      expect(result.modelId).toMatch(/^(groq|openai|anthropic|deepseek):(cheap|smart)$/);
    }
  });
});

describe('routeModel — Pro priority (premium model tier)', () => {
  const cheapTasks = ['generate_question', 'generate_followup', 'extract_jd'] as const;

  it.each(cheapTasks)('Pro user is upgraded to the smart tier on %s', (task) => {
    expect(routeModel(task, { isPro: false }).tier).toBe('cheap');
    expect(routeModel(task, { isPro: true }).tier).toBe('smart');
  });

  it('smart-tier tasks stay smart regardless of Pro status (no double-upgrade)', () => {
    expect(routeModel('evaluate_answer', { isPro: true }).tier).toBe('smart');
    expect(routeModel('evaluate_answer', { isPro: false }).tier).toBe('smart');
    expect(routeModel('generate_summary', { isPro: true }).tier).toBe('smart');
  });

  it('defaults to free (cheap) routing when no options are passed', () => {
    expect(routeModel('generate_question').tier).toBe('cheap');
  });

  it('Pro modelId reflects the upgraded smart tier for telemetry/cost', () => {
    expect(routeModel('generate_question', { isPro: true }).modelId).toMatch(/:smart$/);
  });
});
