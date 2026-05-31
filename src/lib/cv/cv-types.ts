import { z } from 'zod';

// ─── CvData shape ─────────────────────────────────────────────────────────────
// Stored as JSON in User.cvData. Extracted by the LLM parse pipeline.
// All fields are optional at the top level except `roles` (which can be empty []).

export const cvRoleSchema = z.object({
  company:    z.string(),
  title:      z.string(),
  duration:   z.string().optional(),          // e.g. "2022–2024"
  highlights: z.array(z.string()).default([]), // 2-4 tech-focused bullets
});

export const cvProjectSchema = z.object({
  name:        z.string(),
  description: z.string(),                   // 1-2 sentences
  tech:        z.array(z.string()).default([]),
});

export const cvDataSchema = z.object({
  summary:   z.string().optional(),           // ≤3 sentences from profile/summary section
  roles:     z.array(cvRoleSchema).default([]),
  skills:    z.array(z.string()).default([]),  // technical skills only
  projects:  z.array(cvProjectSchema).default([]),
  education: z.string().optional(),           // e.g. "B.Sc. Computer Science, HUST"
});

export type CvRole    = z.infer<typeof cvRoleSchema>;
export type CvProject = z.infer<typeof cvProjectSchema>;
export type CvData    = z.infer<typeof cvDataSchema>;

/** Allowed MIME types for CV file upload. */
export const CV_ALLOWED_MIME = ['application/pdf', 'text/plain'] as const;
export type CvMimeType = typeof CV_ALLOWED_MIME[number];
