// Adapted from Fuwari (MIT License, https://github.com/saicaca/fuwari).
// Turns remark directives (:::note, ::github{...}) into elements that rehype-components can render.
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';

const DIRECTIVE_TYPES = new Set(['containerDirective', 'leafDirective', 'textDirective']);

export function remarkDirectiveRehype() {
  return tree => {
    visit(tree, node => {
      if (!DIRECTIVE_TYPES.has(node.type)) return;
      const data = node.data ?? (node.data = {});
      const attributes = { ...node.attributes };
      if (node.children?.[0]?.data?.directiveLabel) attributes['has-directive-label'] = true;
      const element = h(node.name, attributes);
      data.hName = element.tagName;
      data.hProperties = element.properties;
    });
  };
}
