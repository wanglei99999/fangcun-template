import { expect, test } from './helpers';

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (bytes: Buffer): [number, number] => [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];

const cases = [
  { path: '/', image: '/og/default.png', type: 'website' },
  { path: '/posts', image: '/og/default.png', type: 'website' },
  { path: '/posts/agent-context', image: '/og/posts/agent-context.png', type: 'article' },
  { path: '/notes/java/concurrency', image: '/og/notes/java/concurrency.png', type: 'article' },
];

for (const { path, image, type } of cases) {
  test(`share card for ${path}`, async ({ page, request }) => {
    await page.goto(path);
    const meta = (property: string) => page.locator(`meta[property="${property}"]`);
    await expect(meta('og:type')).toHaveAttribute('content', type);
    await expect(meta('og:title')).toHaveAttribute('content', /\S/);
    await expect(meta('og:description')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');

    const imageUrl = new URL((await meta('og:image').getAttribute('content'))!);
    expect(imageUrl.protocol).toBe('https:');
    expect(imageUrl.pathname).toBe(image);

    const response = await request.get(imageUrl.pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    expect(pngSize(await response.body())).toEqual([1200, 630]);
  });
}
