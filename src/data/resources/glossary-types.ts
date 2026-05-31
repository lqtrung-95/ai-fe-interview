export type GlossaryCategory =
  | 'Performance'
  | 'Rendering'
  | 'Networking'
  | 'JavaScript'
  | 'Browser'
  | 'State Management'
  | 'Architecture'
  | 'Testing'
  | 'Accessibility'
  | 'Security'
  | 'Build & Tooling';

export interface GlossaryEntry {
  /** Full term name, e.g. "Largest Contentful Paint" */
  term: string;
  /** Abbreviation if commonly used, e.g. "LCP" */
  abbr?: string;
  /** 2–3 sentence definition suitable for interview prep */
  definition: string;
  category: GlossaryCategory;
  /** Handbook section ID this term is covered in, if any */
  handbookId?: string;
}

export interface GlossaryData {
  entries: GlossaryEntry[];
}
