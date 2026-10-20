import { expect, test as base, type Page } from '@playwright/test';

/** Fails a test if the page throws an uncaught error. */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await use(errors);
    expect(errors, 'uncaught page errors').toEqual([]);
  }, { auto: true }],
});
export { expect };

export const PAGES = ['/', '/posts', '/notes', '/repos', '/skills', '/toolbox', '/about'];
export const DETAIL_PAGES = ['/posts/agent-context', '/notes/java/concurrency', '/notes/ai/rag', '/archive'];

export const isKnownInternalLink = (href: string): boolean =>
  PAGES.includes(href)
  || /^\/(posts|notes)\/[\w/-]+$/.test(href)
  || /^\/archive(\?tag=.+)?$/.test(href)
  || ['/rss.xml', '/sitemap-index.xml'].includes(href)
  || href.startsWith('/favicon');

export async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

/**
 * Share of the dot-matrix canvas's early ink that lies far (>3px) from any ink once it has settled.
 * Stray dots only exist while the entrance animation is flying; the idle wave just resizes dots in place.
 */
export async function pixelTitleStrayInk(page: Page): Promise<number> {
  await page.waitForSelector('.pixel-title.ready');
  const grab = () => page.locator('.pixel-title canvas').evaluate((canvas: HTMLCanvasElement) => {
    const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
    return { w: canvas.width, h: canvas.height, alpha: Array.from(data.filter((_, i) => i % 4 === 3)) };
  });
  await page.waitForTimeout(120);
  const early = await grab();
  await page.waitForTimeout(2000);
  const late = await grab();
  const radius = 3;
  const nearSettledInk = (x: number, y: number): boolean => {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < late.w && ny < late.h && late.alpha[ny * late.w + nx] > 0) return true;
      }
    }
    return false;
  };
  let ink = 0;
  let stray = 0;
  for (let y = 0; y < early.h; y++) {
    for (let x = 0; x < early.w; x++) {
      if (early.alpha[y * early.w + x] > 40) {
        ink++;
        if (!nearSettledInk(x, y)) stray++;
      }
    }
  }
  return stray / Math.max(ink, 1);
}
