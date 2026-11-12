import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Pages brought in by scripts/sync.mjs. The id is the page's URL path:
// docs/index.md → "docs", docs/extensions/storage.md → "docs/extensions/storage".
export const collections = {
  docs: defineCollection({
    loader: glob({
      pattern: "**/*.md",
      base: "./src/content/docs",
      generateId: ({ entry }) => entry.replace(/\.md$/, "").replace(/(^|\/)index$/, ""),
    }),
    schema: z.object({
      title: z.string(),
      description: z.string().optional(),
      editUrl: z.string().optional(),
      tableOfContents: z.any().optional(),
    }),
  }),
};
