import { DETAIL_PAGES, PAGES, expect, hasHorizontalOverflow, isKnownInternalLink, test } from './helpers';

test.describe('every page', () => {
  for (const path of [...PAGES, ...DETAIL_PAGES]) {
    test(`${path} renders with working links`, async ({ page }) => {
      await page.goto(path);
      if (PAGES.includes(path) && path !== '/') {
        await expect(page.locator('.desktop-nav a.active')).toHaveAttribute('href', path);
      }
      const brokenAnchors = await page.locator('a[href^="#"]').evaluateAll(links => links
        .map(link => decodeURIComponent(link.getAttribute('href')!))
        .filter(hash => hash.length > 1 && !document.getElementById(hash.slice(1))));
      expect(brokenAnchors).toEqual([]);
      const internalLinks = await page.locator('a[href^="/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')!))]);
      expect(internalLinks.filter(href => !isKnownInternalLink(href))).toEqual([]);
    });

    test(`${path} has no horizontal overflow on a phone`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(path);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }
});

test('mobile menu navigates', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('.mobile-menu-toggle').click();
  await page.locator('#mobile-nav').getByRole('link', { name: '知识库', exact: true }).click();
  await expect(page).toHaveURL(/\/notes/);
});

test('theme choice persists across pages', async ({ page }) => {
  await page.goto('/about');
  await page.locator('#theme-toggle').click();
  await page.goto('/posts/agent-context');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('feeds, sitemap and robots', async ({ request }) => {
  const rss = await request.get('/rss.xml');
  expect(rss.status()).toBe(200);
  expect((await rss.text()).match(/<item>/g)).toHaveLength(10);
  expect((await request.get('/sitemap-index.xml')).status()).toBe(200);
  expect(await (await request.get('/robots.txt')).text()).toMatch(/Sitemap: .*sitemap-index\.xml/);
});

test('icons are linked and served', async ({ page, request }) => {
  await page.goto('/');
  for (const href of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png']) {
    await expect(page.locator(`link[href="${href}"]`)).toHaveCount(1);
    expect((await request.get(href)).status()).toBe(200);
  }
});

test('about page: placeholder calendar and disabled forms', async ({ page }) => {
  await page.goto('/about');
  expect(await page.locator('.calendar-grid > span').count()).toBeGreaterThanOrEqual(365);
  await expect(page.locator('.message-form fieldset[disabled]')).toHaveCount(2);
});
