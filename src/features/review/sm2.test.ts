import { describe, it, expect } from 'vitest';
import { applySm2, INITIAL_SM2_STATE } from './sm2';

const NOW = new Date('2026-06-29T00:00:00.000Z');
const daysFromNow = (d: number) => new Date(NOW.getTime() + d * 86400000);

describe('applySm2', () => {
  it('lapses on a low score: resets reps, due tomorrow', () => {
    const prev = { easeFactor: 2.5, intervalDays: 15, repetitions: 4 };
    const r = applySm2(prev, 2, NOW);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(1);
    expect(r.dueAt).toEqual(daysFromNow(1));
    expect(r.easeFactor).toBeLessThan(2.5); // ease still drops on lapse
  });

  it('first success → interval 1 day', () => {
    const r = applySm2(INITIAL_SM2_STATE, 4, NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
  });

  it('second success → interval 6 days', () => {
    const r = applySm2({ easeFactor: 2.5, intervalDays: 1, repetitions: 1 }, 4, NOW);
    expect(r.repetitions).toBe(2);
    expect(r.intervalDays).toBe(6);
  });

  it('third+ success → interval scales by ease factor', () => {
    const r = applySm2({ easeFactor: 2.5, intervalDays: 6, repetitions: 2 }, 5, NOW);
    expect(r.repetitions).toBe(3);
    expect(r.intervalDays).toBe(15); // round(6 * 2.5)
    expect(r.dueAt).toEqual(daysFromNow(15));
  });

  it('ease is unchanged at q=4 and capped at 2.5 on q=5', () => {
    expect(applySm2(INITIAL_SM2_STATE, 4, NOW).easeFactor).toBeCloseTo(2.5, 5);
    expect(applySm2(INITIAL_SM2_STATE, 5, NOW).easeFactor).toBe(2.5); // clamped
  });

  it('ease never drops below the 1.3 floor', () => {
    let state = { easeFactor: 1.3, intervalDays: 1, repetitions: 1 };
    for (let i = 0; i < 5; i++) state = applySm2(state, 1, NOW);
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });
});
