import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** 文章：各大技术团队工程博客的阅读与解读。 */
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Short source label used for filtering, e.g. "Anthropic". */
    blog: z.string(),
    /** The original article being read. */
    source: z.object({ name: z.string(), url: z.url() }),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** 知识库：自己的学习笔记，按主题归档。 */
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    topic: z.string(),
    updated: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts, notes };
