'use client';

import { throwForFailedResponse } from '@/lib/http/rate-limit-error';
import type { FeedbackPayload } from './feedback-types';

interface Options {
  onPartial: (feedback: Partial<FeedbackPayload>) => void;
}

export async function fetchFeedbackStream(
  answerId: string,
  options: Options
): Promise<FeedbackPayload> {
  const response = await fetch(`/api/answers/${answerId}/feedback/generate`, { method: 'POST' });
  if (!response.ok) await throwForFailedResponse(response);
  if (!response.body) throw new Error('Feedback stream was empty.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalFeedback: FeedbackPayload | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const event = parseSSE(part);
      if (event.name === 'partial') options.onPartial(JSON.parse(event.data));
      if (event.name === 'final') finalFeedback = JSON.parse(event.data) as FeedbackPayload;
      if (event.name === 'error') {
        const data = JSON.parse(event.data) as { message?: string };
        throw new Error(data.message ?? 'Feedback generation failed.');
      }
    }
  }

  if (!finalFeedback) throw new Error('Feedback generation did not finish.');
  return finalFeedback;
}

function parseSSE(block: string): { name: string; data: string } {
  let name = 'message';
  const data: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) name = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).trim());
  }
  return { name, data: data.join('\n') };
}
