// Social share cards (Open Graph images), rendered to PNG at build time: satori lays out the card as SVG,
// resvg rasterises it. Fonts come from the self-hosted @fontsource packages, loading only the Noto Sans SC
// subsets that the card's text actually uses.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { site } from '../data/site';
import { GLYPH_SIZE, glyphMarkup } from './glyph';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export interface OgCard {
  /** Small line above the title, e.g. "文章 · Anthropic". */
  kicker?: string;
  /** Line breaks ("\n") are kept. */
  title: string;
  description?: string;
  /** Seed of the page's glyph, so the card shows the same illustration as the page. */
  seed: string;
}

// Light-theme values of the CSS tokens in src/styles/global.css; satori and resvg don't read oklch().
const COLORS = {
  bg: '#faf9f6',
  ink: '#141412',
  muted: '#5c5b56',
  'glyph-ink': '#141412',
  'glyph-sage': '#a8c5ba',
  'glyph-olive': '#6d8352',
  'glyph-blue': '#7999b5',
  'glyph-ochre': '#d3a563',
} as const;

type FontWeight = 500 | 700;
interface SatoriFont { name: string; data: Buffer; weight: FontWeight; style: 'normal' }
interface FontSubset { file: string; ranges: [number, number][] }

const require = createRequire(path.join(process.cwd(), 'package.json'));
const fontFiles = (pkg: string): string => path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files');

/** The @font-face blocks of a fontsource CSS file: which .woff covers which code points. */
function readSubsets(pkg: string, weight: FontWeight): FontSubset[] {
  const css = fs.readFileSync(require.resolve(`${pkg}/${weight}.css`), 'utf8');
  return [...css.matchAll(/url\(\.\/files\/([^)]+\.woff)\) format\('woff'\);\s*unicode-range: ([^;]+);/g)].map(([, file, ranges]) => ({
    file,
    ranges: ranges.split(',').map(range => {
      const [start, end = start] = range.trim().slice(2).split('-');
      return [parseInt(start, 16), parseInt(end, 16)] as [number, number];
    }),
  }));
}

const subsetCache = new Map<string, FontSubset[]>();
const fileCache = new Map<string, Buffer>();

function readFont(pkg: string, file: string): Buffer {
  const key = `${pkg}/${file}`;
  if (!fileCache.has(key)) fileCache.set(key, fs.readFileSync(path.join(fontFiles(pkg), file)));
  return fileCache.get(key)!;
}

/** Hanken Grotesk for Latin text, plus the Noto Sans SC subsets needed for the CJK characters in `text`. */
function fontsFor(text: string): SatoriFont[] {
  const codePoints = new Set([...text].map(char => char.codePointAt(0)!));
  return ([500, 700] as const).flatMap(weight => {
    const key = `noto-${weight}`;
    if (!subsetCache.has(key)) subsetCache.set(key, readSubsets('@fontsource/noto-sans-sc', weight));
    const subsets = subsetCache.get(key)!.filter(subset =>
      [...codePoints].some(point => subset.ranges.some(([start, end]) => point >= start && point <= end)),
    );
    return [
      { name: 'Hanken Grotesk', data: readFont('@fontsource/hanken-grotesk', `hanken-grotesk-latin-${weight}-normal.woff`), weight, style: 'normal' as const },
      // satori keeps one font per name and weight, so each subset needs its own name; it falls back to them per glyph.
      ...subsets.map(subset => ({ name: `Noto Sans SC ${subset.file}`, data: readFont('@fontsource/noto-sans-sc', subset.file), weight, style: 'normal' as const })),
    ];
  });
}

/** The page glyph as a standalone SVG data URI, with the CSS colour variables resolved. */
function glyphDataUri(seed: string): string {
  const markup = glyphMarkup(seed).replace(/var\(--(glyph-[a-z]+)\)/g, (_, token: keyof typeof COLORS) => COLORS[token]);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GLYPH_SIZE} ${GLYPH_SIZE}">${markup}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Cuts text to roughly `max` full-width characters (Latin counts as half), ending with an ellipsis. */
function clip(text: string, max: number): string {
  let width = 0;
  const chars = [...text];
  for (let index = 0; index < chars.length; index++) {
    width += chars[index].charCodeAt(0) < 0x2e80 ? 0.55 : 1;
    if (width > max) return chars.slice(0, index).join('').trimEnd() + '…';
  }
  return text;
}

type Node = { type: string; props: Record<string, unknown> & { style?: Record<string, unknown>; children?: unknown } };
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node =>
  ({ type, props: { ...props, style, children } });

function layout({ kicker, title, description, seed }: OgCard): Node {
  const host = new URL(import.meta.env.SITE ?? 'https://example.com').host;
  const shortTitle = clip(title, 42);
  const titleSize = [...shortTitle].length > 24 ? 56 : 66;
  return h('div', {
    width: OG_WIDTH, height: OG_HEIGHT, display: 'flex', flexDirection: 'column', padding: '72px 80px 52px',
    backgroundColor: COLORS.bg, color: COLORS.ink, fontFamily: 'Hanken Grotesk',
  }, [
    h('div', { display: 'flex', flex: 1, gap: 64 }, [
      h('div', { display: 'flex', flexDirection: 'column', flex: 1 }, [
        kicker ? h('div', { fontSize: 26, fontWeight: 500, color: COLORS.muted, marginBottom: 28 }, kicker) : null,
        h('div', { fontSize: titleSize, fontWeight: 700, lineHeight: 1.22, letterSpacing: '-0.01em', whiteSpace: 'pre-wrap', textWrap: 'balance' }, shortTitle),
        description ? h('div', { fontSize: 28, fontWeight: 500, lineHeight: 1.5, color: COLORS.muted, marginTop: 28, textWrap: 'balance' }, clip(description, 56)) : null,
      ].filter(Boolean)),
      h('img', { width: 236, height: 236 }, undefined, { src: glyphDataUri(seed), width: 236, height: 236 }),
    ]),
    h('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `4px solid ${COLORS.ink}`, paddingTop: 22 }, [
      h('div', { fontSize: 30, fontWeight: 700 }, site.name),
      h('div', { fontSize: 24, fontWeight: 500, color: COLORS.muted }, host),
    ]),
  ]);
}

/** PNG bytes of the share card. */
export async function renderOgImage(card: OgCard): Promise<Uint8Array> {
  const text = [card.kicker, card.title, card.description, site.name].join('');
  const svg = await satori(layout(card) as Parameters<typeof satori>[0], { width: OG_WIDTH, height: OG_HEIGHT, fonts: fontsFor(text) });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
