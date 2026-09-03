import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

// The diagrams are SVGs rendered from D2 sources in the architecture-site repo.
// Their metadata lives in one JSON file rather than in frontmatter, because the
// SVG is the content and there is no prose body to carry frontmatter on.
//
// The schema is not decoration: `status` is validated against an enum so a
// diagram cannot silently ship as `current` when it was only ever designed.
const diagrams = defineCollection({
  loader: file('src/data/diagrams.json'),
  schema: z.object({
    title: z.string(),
    group: z.enum(['practice', 'platform', 'product', 'proposed']),
    status: z.enum(['current', 'proposed']),
    blurb: z.string(),
    order: z.number(),
  }),
});

export const collections = { diagrams };
