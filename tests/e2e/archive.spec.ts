import { expect, test } from './helpers';

test('tags link to the archive, which filters in place and clears', async ({ page }) => {
  await page.goto('/posts/agent-context');
  await page.locator('.article-footer .entry-meta a', { hasText: '#Agent' }).click();
  await expect(page).toHaveURL(/\/archive\/?\?tag=Agent$/);
  const items = page.locator('.timeline-item:visible');
  await expect(items).toHaveCount(3);
  await expect(page.locator('#filter-summary')).toContainText('#Agent 下共 3 篇');
  await expect(page.locator('.tag-chip[aria-current]')).toHaveAttribute('data-tag', 'Agent');

  await page.locator('.tag-chip[data-tag="Java"]').click();
  await expect(items).toHaveCount(2);
  await expect(page).toHaveURL(/tag=Java$/);

  await page.locator('#filter-clear').click();
  await expect(items).toHaveCount(10);
  await expect(page.locator('#filter-status')).toBeHidden();
});
