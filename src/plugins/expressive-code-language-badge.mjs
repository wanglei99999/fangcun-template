// Adapted from Fuwari (MIT License, https://github.com/saicaca/fuwari), originally based on
// https://github.com/expressive-code/expressive-code/issues/153#issuecomment-2282218684
// Shows the language in the corner of untitled code blocks; it fades out on hover so the copy button can take its place.
import { definePlugin } from 'astro-expressive-code';

export function pluginLanguageBadge() {
  return definePlugin({
    name: 'Language Badge',
    baseStyles: () => `
      .frame:not(.has-title):not(.is-terminal) [data-language]::before {
        position: absolute;
        z-index: 2;
        top: 0.6rem;
        right: 0.9rem;
        content: attr(data-language);
        font-family: Consolas, 'SF Mono', Menlo, monospace;
        font-size: 0.75rem;
        color: var(--muted);
        pointer-events: none;
        transition: opacity 0.2s;
      }
      .frame:not(.has-title):not(.is-terminal):hover [data-language]::before { opacity: 0; }
      @media (hover: none) {
        .frame:not(.has-title):not(.is-terminal) [data-language]::before { right: 3.4rem; }
      }
    `,
  });
}
