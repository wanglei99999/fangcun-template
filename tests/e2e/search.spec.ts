import { expect, test } from './helpers';

test('search merges Pagefind full text with metadata and local entries', async ({ page }) => {
  await page.goto('/');
  // Title substring: found through metadata even though Pagefind's Chinese segmentation misses it.
  await page.locator('#hero-query').fill('线程池');
  await page.locator('#hero-query').press('Enter');
  await expect(page.locator('.search-result').first()).toHaveAttribute('href', /\/notes\/java\/concurrency/);

  // Body-only phrase: found by Pagefind, with a highlighted excerpt.
  await page.locator('#site-search').fill('拒绝策略');
  await expect(page.locator('.search-result mark').first()).toBeVisible();
  await expect(page.locator('.search-result').first()).toContainText('Java 并发');

  // Repos, Skills and tools are searched locally and open in the preview dialog.
  await page.locator('#site-search').fill('pagefind');
  await page.locator('#search-results').getByRole('button', { name: /pagefind/ }).click();
  await expect(page.locator('#entry-source')).toHaveAttribute('href', /github\.com\/CloudCannon\/pagefind/);
  await page.keyboard.press('Escape');

  await page.keyboard.press('Control+k');
  await page.locator('#site-search').fill('没有这个词XYZ');
  await expect(page.locator('.search-empty')).toBeVisible();
});
