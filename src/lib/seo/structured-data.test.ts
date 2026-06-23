import { describe, it, expect, vi } from 'vitest';

// Pin the base URL so assertions are deterministic
vi.mock('./site-url', () => ({ getSiteUrl: () => 'https://frontendcoach.app' }));

import {
  buildQuestionQaPageJsonLd,
  buildBreadcrumbJsonLd,
  buildQuestionBreadcrumbs,
  buildTopicHubBreadcrumbs,
  buildSiteIdentityJsonLd,
} from './structured-data';

describe('buildQuestionQaPageJsonLd', () => {
  it('produces a valid QAPage with an accepted answer', () => {
    const out = buildQuestionQaPageJsonLd({
      question: 'What is a closure?',
      answerText: 'A function bundled with its lexical scope.',
      url: 'https://frontendcoach.app/questions/what-is-a-closure',
    });
    expect(out['@type']).toBe('QAPage');
    const main = out.mainEntity as Record<string, unknown>;
    expect(main['@type']).toBe('Question');
    expect(main.name).toBe('What is a closure?');
    expect(main.answerCount).toBe(1);
    const answer = main.acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toContain('lexical scope');
    expect(answer.url).toContain('/questions/what-is-a-closure');
  });
});

describe('buildBreadcrumbJsonLd', () => {
  it('numbers positions starting at 1', () => {
    const out = buildBreadcrumbJsonLd([
      { name: 'Home', url: 'https://frontendcoach.app/' },
      { name: 'Questions', url: 'https://frontendcoach.app/questions' },
    ]);
    expect(out['@type']).toBe('BreadcrumbList');
    const items = out.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(2);
    expect(items[0].position).toBe(1);
    expect(items[1].position).toBe(2);
    expect(items[1].item).toBe('https://frontendcoach.app/questions');
  });
});

describe('buildQuestionBreadcrumbs', () => {
  it('inserts the topic hub crumb for a known topic (React → 4 crumbs)', () => {
    const out = buildQuestionBreadcrumbs({
      topic: 'React',
      questionTitle: 'How does reconciliation work?',
      questionUrl: 'https://frontendcoach.app/questions/how-reconciliation',
    });
    const items = out.itemListElement as Array<Record<string, unknown>>;
    // Home → Interview Questions → React Interview Questions → Question
    expect(items).toHaveLength(4);
    expect(items[2].name).toBe('React Interview Questions');
    expect(items[2].item).toBe('https://frontendcoach.app/questions/react');
    expect(items[3].name).toBe('How does reconciliation work?');
  });

  it('omits the topic crumb for an unknown topic (3 crumbs)', () => {
    const out = buildQuestionBreadcrumbs({
      topic: 'Nonexistent Topic',
      questionTitle: 'Some question',
      questionUrl: 'https://frontendcoach.app/questions/some-question',
    });
    const items = out.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
  });
});

describe('buildTopicHubBreadcrumbs', () => {
  it('builds a 3-level trail ending at the topic hub', () => {
    const out = buildTopicHubBreadcrumbs({
      topicTitle: 'JavaScript Interview Questions',
      topicSlug: 'javascript',
    });
    const items = out.itemListElement as Array<Record<string, unknown>>;
    expect(items).toHaveLength(3);
    expect(items[2].item).toBe('https://frontendcoach.app/questions/javascript');
  });
});

describe('buildSiteIdentityJsonLd', () => {
  it('returns an Organization and a WebSite entity', () => {
    const out = buildSiteIdentityJsonLd();
    expect(out).toHaveLength(2);
    expect(out[0]['@type']).toBe('Organization');
    expect(out[1]['@type']).toBe('WebSite');
    expect(out[0].url).toBe('https://frontendcoach.app');
    expect(out[0].logo).toContain('/brand/');
  });
});
