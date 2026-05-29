/**
 * Centralized query key factory.
 *
 * Hierarchical keys — `studyPlanKeys.all()` = ['studyPlan'] matches all
 * sub-keys via prefix, so `invalidateQueries({ queryKey: keys.all() })`
 * busts the whole domain in one call.
 */

export const studyPlanKeys = {
  all:      () => ['studyPlan'] as const,
  progress: () => ['studyPlan', 'progress'] as const,
  question: (id: string) => ['studyPlan', 'question', id] as const,
};

export const historyKeys = {
  all:    () => ['history'] as const,
  list:   (filters: Record<string, string>) => ['history', 'list', filters] as const,
  detail: (sessionId: string) => ['history', 'detail', sessionId] as const,
};

export const dashboardKeys = {
  all:      () => ['dashboard'] as const,
  overview: () => ['dashboard', 'overview'] as const,
};

export const interviewKeys = {
  all:     () => ['interview'] as const,
  session: (id: string) => ['interview', 'session', id] as const,
};
