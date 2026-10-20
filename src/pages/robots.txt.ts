import type { APIContext } from 'astro';

export function GET(context: APIContext): Response {
  const sitemap = new URL('sitemap-index.xml', context.site).href;
  const body = ['User-agent: *', 'Disallow: /_astro/', '', `Sitemap: ${sitemap}`].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
