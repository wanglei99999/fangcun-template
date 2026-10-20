import { expect, test } from './helpers';

test('posts list filters by source and links to articles', async ({ page }) => {
  await page.goto('/posts');
  const entries = page.locator('#all-articles .entry:visible');
  await expect(entries).toHaveCount(5);
  await page.getByRole('button', { name: /^Anthropic/ }).click();
  await expect(entries).toHaveCount(2);
  await page.getByRole('button', { name: /^全部/ }).click();
  await expect(entries).toHaveCount(5);
  await page.getByRole('link', { name: '比提示词更重要的，是上下文' }).click();
  await expect(page).toHaveURL(/\/posts\/agent-context\/?$/);
});

test('article page: facts, code, scroll-aware TOC, admonitions, license', async ({ page }) => {
  await page.goto('/posts/agent-context');
  await expect(page.locator('h1')).toHaveText('比提示词更重要的，是上下文');
  await expect(page.locator('.facts')).toContainText(/\d+ 字，约 \d+ 分钟/);
  await expect(page.locator('.facts a')).toHaveAttribute('href', 'https://www.anthropic.com/engineering');
  await expect(page.locator('.article-head .glyph')).toHaveCount(1);
  await expect(page.locator('.desktop-nav a.active')).toHaveAttribute('href', '/posts');
  await expect(page.locator('.expressive-code .copy button').first()).toBeAttached();

  await expect(page.locator('.toc-details')).toHaveJSProperty('open', true);
  await expect(page.locator('.toc a[aria-current]')).toHaveText('为什么是上下文');
  await page.evaluate(() => window.scrollBy(0, document.getElementById('工具的边界')!.getBoundingClientRect().top - 80));
  await expect(page.locator('.toc a[aria-current]')).toHaveText('工具的边界');
  await expect(page.locator('.pager-prev')).toHaveAttribute('href', '/posts/agent-harness');

  await expect(page.locator('.admonition-tip .admonition-title')).toHaveText('一个判断标准');
  await expect(page.locator('.admonition-warning .admonition-title')).toHaveText('警告');
  await expect(page.locator('.license')).toContainText('原文版权归原作者所有');
  await expect(page.locator('.license dd a')).toHaveAttribute('href', 'https://www.anthropic.com/engineering');
});

test('note page: crumbs, topic-scoped pager, GitHub-style admonition, own license', async ({ page }) => {
  await page.goto('/notes/java/concurrency');
  await expect(page.locator('.crumbs a')).toHaveCount(2);
  await expect(page.locator('.pager-prev')).toHaveAttribute('href', '/notes/java/jvm-memory');
  await expect(page.locator('.admonition-important')).toHaveCount(1);
  await expect(page.locator('.license')).toContainText('CC BY-NC-SA 4.0');
});

test('math, heading anchors, collapsible code, lightbox, back to top', async ({ page }) => {
  await page.goto('/notes/ai/rag');
  await expect(page.locator('.katex-display')).toHaveCount(2);
  expect(await page.locator('.katex').count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.prose h2 .heading-anchor')).toHaveCount(4);
  await expect(page.locator('.toc a').first()).toHaveText('整体流程');
  await expect(page.locator('.expressive-code details.ec-section')).toHaveCount(1);
  await expect(page.locator('.expressive-code details.ec-section summary')).toContainText('已折叠 5 行');
  expect(await page.locator('.expressive-code .gutter').count()).toBeGreaterThan(0);

  await page.locator('.prose img').click();
  await expect(page.locator('.pswp--open')).toBeVisible();
  // PhotoSwipe ignores close requests until its 333ms opening animation ends.
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await expect(page.locator('.pswp--open')).toHaveCount(0);

  await expect(page.locator('#back-to-top')).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('#back-to-top')).toBeVisible();
  await page.locator('#back-to-top').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
});

test('GitHub card links to the repo and fills in when the API answers', async ({ page }) => {
  await page.goto('/posts/code-search');
  const card = page.locator('.github-card');
  await expect(card).toHaveAttribute('href', 'https://github.com/CloudCannon/pagefind');
  await expect(card).toHaveClass(/loaded|failed/, { timeout: 10_000 });
  if (await card.evaluate(element => element.classList.contains('loaded'))) {
    await expect(card.locator('.gc-description')).not.toHaveText('在 GitHub 上查看这个仓库');
  }
});

test('TOC collapses above the text on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/notes/java/concurrency');
  const details = page.locator('.toc-details');
  await expect(details).toHaveJSProperty('open', false);
  await page.locator('.toc summary').click();
  await page.locator('.toc a').nth(1).click();
  await expect(details).toHaveJSProperty('open', false);
});
