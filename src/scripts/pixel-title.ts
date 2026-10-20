// Dot-matrix wordmark: text is sampled into a grid once, then redrawn every frame as ink squares that
// swell along a slow diagonal wave and drift away from the pointer.

const SAMPLE_CELL = 12; // offscreen px per grid cell
const ROWS = 22; // grid rows the glyph height maps to; dense enough for many-stroke characters
const MAX_CELL = 10; // largest on-screen cell, in CSS px
const COVERAGE = 0.32; // share of ink a cell needs to be lit
const POINTER_RADIUS = 6; // in cells
const POINTER_PUSH = 0.7; // max offset, in cells
const EASE = 0.14; // per-frame approach of the pointer offset
// data-assemble="always" replays the entrance on every load (404); "once" plays a quicker one on a reload or when
// arriving from outside the site, but not when navigating back to the page from within the site (home).
const ASSEMBLE_TIMING = {
  always: { flight: 1400, stagger: 700 }, // ms per dot, max random delay before it starts
  once: { flight: 700, stagger: 350 },
} as const;
type AssembleMode = keyof typeof ASSEMBLE_TIMING;
const FONT_FAMILY = "'Noto Sans SC', 'Hanken Grotesk', 'PingFang SC', 'Microsoft YaHei', sans-serif";

interface Grid {
  cols: number;
  rows: number;
  lit: { col: number; row: number }[];
}

/** Renders `text` offscreen and keeps the cells whose ink coverage passes COVERAGE. */
function sample(text: string): Grid {
  const fontPx = ROWS * SAMPLE_CELL * 0.86;
  const font = `700 ${fontPx}px ${FONT_FAMILY}`;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.font = font;
  const cols = Math.ceil(context.measureText(text).width / SAMPLE_CELL) + 1;
  canvas.width = cols * SAMPLE_CELL;
  canvas.height = ROWS * SAMPLE_CELL;
  context.font = font;
  context.textBaseline = 'middle';
  context.fillText(text, SAMPLE_CELL / 2, canvas.height / 2);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const offsets = [0.25, 0.5, 0.75];
  const lit: Grid['lit'] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < cols; col++) {
      let ink = 0;
      for (const dy of offsets) for (const dx of offsets) {
        const x = Math.floor((col + dx) * SAMPLE_CELL);
        const y = Math.floor((row + dy) * SAMPLE_CELL);
        if (data[(y * canvas.width + x) * 4 + 3] > 128) ink++;
      }
      if (ink / (offsets.length ** 2) >= COVERAGE) lit.push({ col, row });
    }
  }
  return { cols, rows: ROWS, lit };
}

const smoothstep = (x: number): number => x * x * (3 - 2 * x);
const easeOutExpo = (x: number): number => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));

/** Whether this load should play the entrance, based on how the page was reached. */
function shouldAssemble(mode: string | undefined): mode is AssembleMode {
  if (mode === 'always') return true;
  if (mode !== 'once') return false;
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navigation?.type === 'reload') return true;
  if (navigation?.type === 'back_forward') return false;
  let fromThisSite = false;
  try { fromThisSite = new URL(document.referrer).origin === location.origin; } catch {}
  return !fromThisSite;
}

function mount(root: HTMLElement): void {
  const text = root.dataset.text ?? '';
  const canvas = root.querySelector('canvas')!;
  const context = canvas.getContext('2d')!;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let grid: Grid = { cols: 0, rows: 0, lit: [] };
  let cell = MAX_CELL;
  let ink = '';
  let offsetX = new Float32Array(0);
  let offsetY = new Float32Array(0);
  const pointer = { x: 0, y: 0, active: false };
  let frame = 0;
  let visible = true;
  // data-assemble: dots start scattered across the canvas and fly into the text once.
  let scatterX = new Float32Array(0);
  let scatterY = new Float32Array(0);
  let delays = new Float32Array(0);
  let assembleStart = -Infinity;
  let flightMs: number = ASSEMBLE_TIMING.always.flight;

  const readInk = (): void => { ink = getComputedStyle(root).color; };

  function layout(): void {
    if (!grid.cols) return;
    cell = Math.min(MAX_CELL, root.clientWidth / grid.cols);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.style.width = `${grid.cols * cell}px`;
    canvas.style.height = `${grid.rows * cell}px`;
    canvas.width = Math.round(grid.cols * cell * ratio);
    canvas.height = Math.round(grid.rows * cell * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw(time: number): void {
    frame = 0;
    const still = reducedMotion.matches;
    context.clearRect(0, 0, grid.cols * cell, grid.rows * cell);
    context.fillStyle = ink;
    grid.lit.forEach(({ col, row }, index) => {
      const wave = still ? 0.6 : 0.5 + 0.5 * Math.sin(0.35 * col + 0.22 * row - time * 0.0016);
      const cx = (col + 0.5) * cell;
      const cy = (row + 0.5) * cell;
      let pull = 0;
      let targetX = 0;
      let targetY = 0;
      if (pointer.active && !still) {
        const dx = cx - pointer.x;
        const dy = cy - pointer.y;
        const distance = Math.hypot(dx, dy);
        const radius = POINTER_RADIUS * cell;
        if (distance < radius && distance > 0.01) {
          pull = smoothstep(1 - distance / radius);
          targetX = (dx / distance) * POINTER_PUSH * cell * pull;
          targetY = (dy / distance) * POINTER_PUSH * cell * pull;
        }
      }
      offsetX[index] += (targetX - offsetX[index]) * EASE;
      offsetY[index] += (targetY - offsetY[index]) * EASE;
      const settle = still ? 1 : easeOutExpo(clamp01((time - assembleStart - delays[index]) / flightMs));
      const flyX = settle < 1 ? (scatterX[index] - col) * cell * (1 - settle) : 0;
      const flyY = settle < 1 ? (scatterY[index] - row) * cell * (1 - settle) : 0;
      const size = cell * (0.6 + 0.26 * wave + 0.14 * pull) * (0.5 + 0.5 * settle);
      context.globalAlpha = Math.min(1, 0.55 + 0.42 * wave + 0.2 * pull) * (0.35 + 0.65 * settle);
      context.fillRect(cx + offsetX[index] + flyX - size / 2, cy + offsetY[index] + flyY - size / 2, size, size);
    });
    context.globalAlpha = 1;
    if (!still) schedule();
  }

  function schedule(): void {
    if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function restart(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    draw(performance.now());
  }

  async function init(): Promise<void> {
    // Load the exact font slices for these characters before sampling, so the grid isn't built from a fallback face.
    try { await document.fonts.load(`700 100px ${FONT_FAMILY}`, text); } catch {}
    grid = sample(text);
    if (!grid.lit.length) return; // keep the fallback text visible
    offsetX = new Float32Array(grid.lit.length);
    offsetY = new Float32Array(grid.lit.length);
    scatterX = new Float32Array(grid.lit.length);
    scatterY = new Float32Array(grid.lit.length);
    delays = new Float32Array(grid.lit.length);
    const mode = root.dataset.assemble;
    if (!reducedMotion.matches && shouldAssemble(mode)) {
      const timing = ASSEMBLE_TIMING[mode];
      flightMs = timing.flight;
      grid.lit.forEach((_, index) => {
        scatterX[index] = Math.random() * grid.cols;
        scatterY[index] = Math.random() * grid.rows;
        delays[index] = Math.random() * timing.stagger;
      });
      assembleStart = performance.now();
    }
    readInk();
    layout();
    root.classList.add('ready');
    restart();
  }

  canvas.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; });
  new ResizeObserver(() => { layout(); restart(); }).observe(root);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); }).observe(root);
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', restart);
  new MutationObserver(() => { readInk(); restart(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  void init();
}

document.querySelectorAll<HTMLElement>('.pixel-title[data-text]').forEach(mount);
