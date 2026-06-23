import { describe, it, expect } from 'vitest';
import { searchResources, tokenize, buildSnippet } from './resource-search-engine';
import type { ResourceSearchRecord } from './resource-search-types';

const records: ResourceSearchRecord[] = [
  {
    handbook: 'react-deep-dive',
    handbookTitle: 'React Deep Dive',
    url: '/resources/react-deep-dive#hooks',
    sectionTitle: 'Hooks and the rules of hooks',
    text: 'useState and useEffect let function components hold state and run effects.',
  },
  {
    handbook: 'javascript-core',
    handbookTitle: 'JavaScript Core',
    url: '/resources/javascript-core#closures',
    sectionTitle: 'Closures and lexical scope',
    text: 'A closure is a function bundled with references to its surrounding lexical state.',
  },
  {
    handbook: 'glossary',
    handbookTitle: 'Glossary',
    url: '/resources/glossary',
    sectionTitle: 'Hydration',
    text: 'Hydration attaches event listeners to server-rendered HTML on the client.',
  },
];

describe('tokenize', () => {
  it('lowercases and splits on whitespace, dropping empties', () => {
    expect(tokenize('  Use   STATE ')).toEqual(['use', 'state']);
    expect(tokenize('')).toEqual([]);
  });
});

describe('searchResources', () => {
  it('returns nothing for an empty query', () => {
    expect(searchResources(records, '   ')).toEqual([]);
  });

  it('matches a token in the body text', () => {
    const out = searchResources(records, 'closure');
    expect(out).toHaveLength(1);
    expect(out[0].record.url).toBe('/resources/javascript-core#closures');
  });

  it('ranks a title match above a body-only match', () => {
    const out = searchResources(records, 'hooks');
    // "Hooks" is in the React section title; appears nowhere else
    expect(out[0].record.handbook).toBe('react-deep-dive');
  });

  it('uses AND semantics — every token must be present', () => {
    expect(searchResources(records, 'closure hydration')).toHaveLength(0);
    expect(searchResources(records, 'lexical closure')).toHaveLength(1);
  });

  it('is case-insensitive', () => {
    expect(searchResources(records, 'USESTATE')).toHaveLength(1);
  });
});

describe('buildSnippet', () => {
  it('centers the window on the earliest matched token with ellipses', () => {
    // >90 chars on each side of the token so both ellipses are appended
    const long = `${'a '.repeat(60)}keyword ${'b '.repeat(60)}`.trim();
    const snippet = buildSnippet(long, ['keyword']);
    expect(snippet).toContain('keyword');
    expect(snippet.startsWith('…')).toBe(true);
    expect(snippet.endsWith('…')).toBe(true);
  });

  it('returns leading text when no token is found', () => {
    expect(buildSnippet('short text', ['missing'])).toBe('short text');
  });
});
