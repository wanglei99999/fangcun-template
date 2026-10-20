// Adapted from Fuwari (MIT License, https://github.com/saicaca/fuwari).
import { h } from 'hastscript';

export const ADMONITION_TITLES = {
  note: '注意',
  tip: '提示',
  important: '重要',
  warning: '警告',
  caution: '小心',
};

/**
 * Renders `:::note[可选标题] ... :::` (or GitHub's `> [!NOTE]`) as an <aside> callout.
 * @param {Record<string, unknown>} properties
 * @param {import('hast').ElementContent[]} children
 * @param {keyof typeof ADMONITION_TITLES} type
 */
export function AdmonitionComponent(properties, children, type) {
  if (!Array.isArray(children) || children.length === 0) {
    return h('p', { class: 'directive-error' }, `提示框 :::${type} 需要写成块级语法，并包含内容。`);
  }
  let title = ADMONITION_TITLES[type];
  let body = children;
  if (properties?.hasDirectiveLabel || properties?.['has-directive-label']) {
    const [label, ...rest] = children;
    title = label.children ?? title;
    body = rest;
  }
  return h('aside', { class: `admonition admonition-${type}`, role: 'note' }, [
    h('p', { class: 'admonition-title' }, title),
    ...body,
  ]);
}
