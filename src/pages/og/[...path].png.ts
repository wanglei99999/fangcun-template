// Share card per article and note at /og/<page path>.png, plus /og/default.png for every other page.
import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '../../data/site';
import { getNotes, getPosts, noteUrl, postUrl } from '../../utils/content';
import { renderOgImage, type OgCard } from '../../utils/og';

export const getStaticPaths = (async () => {
  const [posts, notes] = await Promise.all([getPosts(), getNotes()]);
  const page = (url: string, card: Omit<OgCard, 'seed'>) => ({ params: { path: url.slice(1) }, props: { ...card, seed: `${url}/` } });
  return [
    { params: { path: 'default' }, props: { title: site.motto.join('\n'), description: site.description, seed: 'home' } },
    ...posts.map(post => page(postUrl(post), { kicker: `文章 · ${post.data.blog}`, title: post.data.title, description: post.data.description })),
    ...notes.map(note => page(noteUrl(note), { kicker: `知识库 · ${note.data.topic}`, title: note.data.title, description: note.data.description })),
  ];
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) =>
  new Response(await renderOgImage(props as OgCard), { headers: { 'Content-Type': 'image/png' } });
