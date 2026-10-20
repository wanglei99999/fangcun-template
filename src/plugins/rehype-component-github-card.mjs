// Markup adapted from Fuwari (MIT License, https://github.com/saicaca/fuwari).
// Unlike the original, no per-card inline script: src/scripts/github-cards.ts fills in live data.
import { h } from 'hastscript';

const REPO_PATTERN = /^[\w.-]+\/[\w.-]+$/;

/**
 * Renders `::github{repo="owner/name"}` as a static card linking to the repository.
 * @param {{ repo?: string }} properties
 * @param {import('hast').ElementContent[]} children
 */
export function GithubCardComponent(properties, children) {
  if (Array.isArray(children) && children.length > 0) {
    return h('p', { class: 'directive-error' }, 'GitHub 卡片要写成单行语法：::github{repo="owner/name"}');
  }
  const repo = String(properties?.repo ?? '');
  if (!REPO_PATTERN.test(repo)) {
    return h('p', { class: 'directive-error' }, `GitHub 卡片的 repo 格式应为 owner/name，收到的是“${repo}”。`);
  }
  const [owner, name] = repo.split('/');
  return h('a.github-card', { href: `https://github.com/${repo}`, target: '_blank', rel: 'noopener noreferrer', 'data-repo': repo }, [
    h('span.gc-title', [h('span.gc-avatar', { 'aria-hidden': 'true' }), h('span.gc-owner', owner), h('span.gc-divider', '/'), h('strong.gc-name', name)]),
    h('span.gc-description', '在 GitHub 上查看这个仓库'),
    h('span.gc-stats', [
      h('span.gc-stars', { 'data-label': 'Star' }),
      h('span.gc-forks', { 'data-label': 'Fork' }),
      h('span.gc-language'),
      h('span.gc-license'),
    ]),
  ]);
}
