import { throwForFailedResponse } from '@/lib/http/rate-limit-error';

export async function submitPrimaryAnswer(questionId: string, answer: string): Promise<string> {
  const response = await fetch('/api/answers', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ questionId, answer }),
  });
  if (!response.ok) await throwForFailedResponse(response);
  const body = (await response.json()) as { answerId: string };
  return body.answerId;
}

export async function generateFollowUp(answerId: string): Promise<string> {
  const response = await fetch(`/api/answers/${answerId}/followup`, { method: 'POST' });
  if (!response.ok) await throwForFailedResponse(response);
  const body = (await response.json()) as { followUp: string };
  return body.followUp;
}

export async function saveFollowUpAnswer(answerId: string, followUpAnswer: string): Promise<void> {
  const response = await fetch(`/api/answers/${answerId}/followup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ followUpAnswer }),
  });
  if (!response.ok) await throwForFailedResponse(response);
}

export async function endInterviewSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}/end`, { method: 'POST' });
  if (!response.ok) await throwForFailedResponse(response);
}

export async function completeInterviewSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' });
  if (!response.ok) await throwForFailedResponse(response);
}
