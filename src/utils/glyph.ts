// Deterministic 2×2 geometric illustrations. Each seed (usually a page URL) always yields the same glyph:
// four distinct shapes drawn in ink, one of them filled with a muted accent colour.

const CELL = 100;
const GAP = 16;
export const GLYPH_SIZE = CELL * 2 + GAP;

type Shape = (paint: string) => string;

const stroke = (paint: string, width = 7): string =>
  `fill="none" stroke="${paint}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
const dots = (points: [number, number][], r: number, paint: string): string =>
  points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${paint}"/>`).join('');

/** Shapes that read as solid masses; the accent colour goes on one of these. */
const FILLED: Record<string, Shape> = {
  triangle: paint => `<polygon points="50,8 94,92 6,92" fill="${paint}" stroke="${paint}" stroke-width="4" stroke-linejoin="round"/>`,
  diamond: paint => `<polygon points="50,6 94,50 50,94 6,50" fill="${paint}" stroke="${paint}" stroke-width="4" stroke-linejoin="round"/>`,
  notch: paint => `<path d="M8 8 H58 A34 34 0 0 0 92 42 V92 H8 Z" fill="${paint}"/>`,
  pills: paint => `<rect x="8" y="16" width="84" height="28" rx="14" fill="${paint}"/><rect x="8" y="56" width="58" height="28" rx="14" fill="${paint}"/>`,
  sunrise: paint => `<path d="M8 72 A42 42 0 0 1 92 72 Z" fill="${paint}"/><line x1="8" y1="88" x2="92" y2="88" ${stroke(paint)}/>`,
  quarter: paint => `<path d="M8 8 H50 A42 42 0 0 1 92 50 V92 H8 Z" fill="${paint}"/>`,
};

/** Line drawings, always in ink. */
const OUTLINED: Record<string, Shape> = {
  pluses: paint =>
    `<path d="${[20, 50, 80].flatMap(y => [20, 50, 80].map(x => `M${x - 9} ${y} H${x + 9} M${x} ${y - 9} V${y + 9}`)).join(' ')}" ${stroke(paint, 6)}/>`,
  spiral: paint => `<path d="M50 50 H62 V38 H38 V74 H86 V14 H14 V92" ${stroke(paint)}/>`,
  bars: paint => `<path d="M18 92 V60 M40 92 V24 M62 92 V44 M84 92 V12" ${stroke(paint, 9)}/>`,
  nested: paint => `<rect x="10" y="10" width="80" height="80" rx="3" ${stroke(paint, 6)}/><polygon points="50,24 76,50 50,76 24,50" ${stroke(paint, 6)}/>`,
  arcs: paint => [16, 32, 48].map(r => `<path d="M${50 - r} 90 A${r} ${r} 0 0 1 ${50 + r} 90" ${stroke(paint)}/>`).join(''),
  waves: paint => [18, 40, 62, 84].map(y => `<path d="M8 ${y} q10.5 -12 21 0 t21 0 t21 0 t21 0" ${stroke(paint, 6)}/>`).join(''),
  frame: paint => `<rect x="12" y="12" width="76" height="76" rx="3" ${stroke(paint)}/>` + dots([[12, 12], [88, 12], [12, 88], [88, 88]], 9, paint),
  ring: paint =>
    `<circle cx="50" cy="50" r="14" ${stroke(paint, 6)}/>` +
    dots(Array.from({ length: 8 }, (_, i) => [50 + 36 * Math.cos((i * Math.PI) / 4), 50 + 36 * Math.sin((i * Math.PI) / 4)] as [number, number]), 8, paint),
  steps: paint => `<path d="M8 92 V68 H32 V44 H56 V20 H92" ${stroke(paint)}/>` + dots([[92, 20]], 10, paint),
};

const ACCENTS = ['var(--glyph-sage)', 'var(--glyph-olive)', 'var(--glyph-blue)', 'var(--glyph-ochre)'];

/** FNV-1a hash feeding a mulberry32 generator. */
function random(seed: string): () => number {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.codePointAt(0)!, 16777619);
  let state = hash >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(next: () => number, items: T[]): T {
  return items[Math.floor(next() * items.length)];
}

/** SVG markup (without the outer <svg>) for the glyph of `seed`. */
export function glyphMarkup(seed: string): string {
  const next = random(seed);
  const outlined = Object.values(OUTLINED).toSorted(() => next() - 0.5).slice(0, 3);
  const accentShape = pick(next, Object.values(FILLED));
  const accentColour = pick(next, ACCENTS);
  const accentCell = Math.floor(next() * 4);
  const cells: string[] = [];
  for (let index = 0, line = 0; index < 4; index++) {
    cells.push(index === accentCell ? accentShape(accentColour) : outlined[line++]('var(--glyph-ink)'));
  }
  return cells
    .map((shape, index) => `<g transform="translate(${(index % 2) * (CELL + GAP)} ${Math.floor(index / 2) * (CELL + GAP)})">${shape}</g>`)
    .join('');
}
