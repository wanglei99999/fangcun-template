import { defineConfig } from 'astro/config';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import { pluginCollapsibleSections, pluginCollapsibleSectionsTexts } from '@expressive-code/plugin-collapsible-sections';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import expressiveCode from 'astro-expressive-code';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeComponents from 'rehype-components';
import rehypeKatex from 'rehype-katex';
import remarkDirective from 'remark-directive';
import remarkGithubAdmonitionsToDirectives from 'remark-github-admonitions-to-directives';
import remarkMath from 'remark-math';
import { pluginLanguageBadge } from './src/plugins/expressive-code-language-badge.mjs';
import { AdmonitionComponent, ADMONITION_TITLES } from './src/plugins/rehype-component-admonition.mjs';
import { GithubCardComponent } from './src/plugins/rehype-component-github-card.mjs';
import { remarkDirectiveRehype } from './src/plugins/remark-directive-rehype.mjs';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';

pluginCollapsibleSectionsTexts.overrideTexts(undefined, { collapsedLines: '已折叠 {lineCount} 行，点击展开' });

// Public URL of the deployed site, used by RSS, the sitemap and canonical links. Set SITE_URL when deploying.
const SITE_URL = process.env.SITE_URL ?? 'https://notes.example.com';

// v2 of the plugin maps IMPORTANT/CAUTION to Docusaurus names (info/danger); keep GitHub's own names instead.
const githubAlertMapping = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'important', WARNING: 'warning', CAUTION: 'caution' };

const admonitions = Object.fromEntries(
  Object.keys(ADMONITION_TITLES).map(type => [type, (properties, children) => AdmonitionComponent(properties, children, type)]),
);

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark'],
      // Follow the site's own theme toggle instead of the OS setting.
      useDarkModeMediaQuery: false,
      themeCssSelector: theme => (theme.type === 'dark' ? ':root[data-theme=dark]' : ':root:not([data-theme=dark])'),
      plugins: [pluginLineNumbers(), pluginCollapsibleSections(), pluginLanguageBadge()],
      defaultProps: {
        wrap: true,
        showLineNumbers: true,
        // Line numbers add noise to commands and plain text.
        overridesByLang: {
          'bash,sh,shell,shellsession,powershell,ps1,cmd,text,txt,plaintext,md,markdown': { showLineNumbers: false },
        },
      },
      styleOverrides: {
        borderRadius: '6px',
        borderColor: 'var(--line)',
        codeBackground: 'var(--code-bg)',
        codeFontFamily: "Consolas, 'SF Mono', Menlo, monospace",
        codeFontSize: '14px',
        codeLineHeight: '1.7',
        uiFontFamily: "'Hanken Grotesk', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        frames: {
          editorBackground: 'var(--code-bg)',
          terminalBackground: 'var(--code-bg)',
          editorTabBarBackground: 'var(--code-bar)',
          editorActiveTabBackground: 'var(--code-bg)',
          editorActiveTabIndicatorTopColor: 'var(--ink)',
          editorTabBarBorderBottomColor: 'var(--line)',
          terminalTitlebarBackground: 'var(--code-bar)',
          terminalTitlebarBorderBottomColor: 'var(--line)',
          frameBoxShadowCssValue: 'none',
        },
      },
    }),
    sitemap(),
  ],
  markdown: {
    // The unified (remark/rehype) processor keeps the plugin ecosystem Fuwari's extensions are built on.
    processor: unified({
      remarkPlugins: [
        remarkReadingTime,
        remarkMath,
        [remarkGithubAdmonitionsToDirectives, { mapping: githubAlertMapping }],
        remarkDirective,
        remarkDirectiveRehype,
      ],
      rehypePlugins: [
        rehypeKatex,
        [rehypeComponents, { components: { github: GithubCardComponent, ...admonitions } }],
        // Ids first (Astro's own, so the TOC sees clean heading text), then an appended "#" link.
        rehypeHeadingIds,
        [rehypeAutolinkHeadings, {
          behavior: 'append',
          properties: { className: ['heading-anchor'], ariaLabel: '复制本节链接', 'data-pagefind-ignore': true },
          content: { type: 'text', value: '#' },
        }],
      ],
    }),
  },
});
