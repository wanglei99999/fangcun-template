import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { getNotes, getPosts, noteUrl, postUrl } from '../utils/content';

/** One feed for both sections, newest first. Items carry the summary and link to the full page. */
export async function GET(context: APIContext): Promise<Response> {
  const [posts, notes] = await Promise.all([getPosts(), getNotes()]);
  const items = [
    ...posts.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.published,
      link: postUrl(post),
      categories: ['文章', post.data.blog, ...post.data.tags],
    })),
    ...notes.map(note => ({
      title: note.data.title,
      description: note.data.description,
      pubDate: note.data.updated,
      link: noteUrl(note),
      categories: ['知识库', note.data.topic, ...note.data.tags],
    })),
  ].toSorted((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: site.name,
    description: site.description,
    site: context.site!,
    items,
    customData: '<language>zh-CN</language>',
  });
}
