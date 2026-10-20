import { expect, pixelTitleStrayInk, test } from './helpers';

const PLAYING = 0.2; // stray-ink share above which the entrance is considered to be playing

test('home: dot-matrix title renders and the real heading is text', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('方寸之间 — 细微之处有乾坤');
  await expect(page.locator('.pixel-title')).toHaveClass(/ready/);
  expect(await page.locator('.pixel-title canvas').evaluate((canvas: HTMLCanvasElement) => canvas.width > 0 && canvas.height > 0)).toBe(true);
  await expect(page.locator('.pixel-title-fallback')).toBeHidden();
  await expect(page.locator('h1')).toHaveText('方寸之间见天地，细微之处有乾坤。');
});

test('home entrance plays on open and reload, not when returning within the site', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toBeVisible(); // content never waits for the animation
  expect(await pixelTitleStrayInk(page)).toBeGreaterThan(PLAYING);

  await page.reload({ waitUntil: 'domcontentloaded' });
  expect(await pixelTitleStrayInk(page)).toBeGreaterThan(PLAYING);

  await page.goto('/posts');
  await page.locator('.brand').click();
  await expect(page).toHaveURL(/\/$/);
  expect(await pixelTitleStrayInk(page)).toBeLessThan(PLAYING);

  await page.goto('/notes');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  expect(await pixelTitleStrayInk(page)).toBeLessThan(PLAYING);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the title is drawn complete and stays still', async ({ page }) => {
    await page.goto('/missing-page');
    await expect(page.locator('.pixel-title')).toHaveClass(/ready/);
    const canvas = page.locator('.pixel-title canvas');
    const first = await canvas.screenshot();
    await page.waitForTimeout(600);
    expect((await canvas.screenshot()).equals(first)).toBe(true);
  });
});

test('404 names the address, suggests a search and a random entry, and always plays', async ({ page }) => {
  const response = await page.goto('/notes/java/thread-local', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(404);
  expect(await pixelTitleStrayInk(page)).toBeGreaterThan(PLAYING);
  await expect(page.locator('h1')).toHaveText('此页不在方寸之间。');
  await expect(page.locator('.not-found-path')).toHaveText('/notes/java/thread-local');
  await expect(page.locator('#not-found-query')).toHaveValue('thread local');
  await expect(page.locator('#random-entry')).toHaveAttribute('href', /^\/(posts|notes)\//);

  const glyph = await page.locator('.not-found-glyph').innerHTML();
  await page.locator('#not-found-query').press('Enter');
  await expect(page.locator('#search-dialog')).toHaveJSProperty('open', true);
  await page.keyboard.press('Escape');

  await page.goto('/some/other-missing-page', { waitUntil: 'domcontentloaded' });
  expect(await pixelTitleStrayInk(page)).toBeGreaterThan(PLAYING);
  expect(await page.locator('.not-found-glyph').innerHTML()).not.toBe(glyph);
});
