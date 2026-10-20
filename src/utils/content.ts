import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Note = CollectionEntry<'notes'>;

const isPublished = ({ data }: { data: { draft: boolean } }): boolean => import.meta.env.DEV || !data.draft;

/** Posts, newest first. Drafts only show in dev. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection('posts', isPublished);
  return posts.toSorted((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

/** Notes, most recently updated first. Drafts only show in dev. */
export async function getNotes(): Promise<Note[]> {
  const notes = await getCollection('notes', isPublished);
  return notes.toSorted((a, b) => b.data.updated.valueOf() - a.data.updated.valueOf());
}

export const postUrl = (post: Post): string => `/posts/${post.id}`;
export const noteUrl = (note: Note): string => `/notes/${note.id}`;
export const tagUrl = (tag: string): string => `/archive?tag=${encodeURIComponent(tag)}`;

export interface ArchiveItem {
  kind: '文章' | '知识库';
  title: string;
  url: string;
  date: Date;
  /** Blog source for articles, topic for notes. */
  group: string;
  tags: string[];
}

/** Articles and notes on one timeline, newest first. */
export async function getArchive(): Promise<ArchiveItem[]> {
  const [posts, notes] = await Promise.all([getPosts(), getNotes()]);
  return [
    ...posts.map(post => ({ kind: '文章' as const, title: post.data.title, url: postUrl(post), date: post.data.published, group: post.data.blog, tags: post.data.tags })),
    ...notes.map(note => ({ kind: '知识库' as const, title: note.data.title, url: noteUrl(note), date: note.data.updated, group: note.data.topic, tags: note.data.tags })),
  ].toSorted((a, b) => b.date.valueOf() - a.date.valueOf());
}

/** YYYY-MM-DD in the site's own calendar, independent of the build machine's timezone. */
export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface Neighbor {
  title: string;
  url: string;
}

/** Previous (older) and next (newer) entries around `index` in a newest-first list. */
export function neighbors<T>(list: T[], index: number, toLink: (item: T) => Neighbor): { prev?: Neighbor; next?: Neighbor } {
  return {
    prev: index < list.length - 1 ? toLink(list[index + 1]) : undefined,
    next: index > 0 ? toLink(list[index - 1]) : undefined,
  };
}
