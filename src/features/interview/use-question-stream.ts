'use client';

import { throwForFailedResponse } from '@/lib/http/rate-limit-error';
import type { ActiveQuestion } from './question-stream-types';

interface Options {
  onPartial: (question: string) => void;
}

export async function fetchQuestionStream(
  sessionId: string,
  options: Options
): Promise<ActiveQuestion> {
  const response = await fetch(`/api/sessions/${sessionId}/questions/generate`, { method: 'POST' });
  if (!response.ok) await throwForFailedResponse(response);
  if (!response.body) throw new Error('Question stream was empty.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalQuestion: ActiveQuestion | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      const event = parseSSE(part);
      if (event.name === 'partial') {
        const data = JSON.parse(event.data) as { question?: string };
        if (data.question) options.onPartial(data.question);
      }
      if (event.name === 'final') finalQuestion = JSON.parse(event.data) as ActiveQuestion;
      if (event.name === 'error') {
        const data = JSON.parse(event.data) as { message?: string };
        throw new Error(data.message ?? 'Question generation failed.');
      }
    }
  }

  if (!finalQuestion) throw new Error('Question generation did not finish.');
  return finalQuestion;
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
