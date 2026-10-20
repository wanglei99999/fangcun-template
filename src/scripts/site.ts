import { entries } from '../data/content';

const searchDialog = document.querySelector<HTMLDialogElement>('#search-dialog')!;
const entryDialog = document.querySelector<HTMLDialogElement>('#entry-dialog')!;
const searchInput = document.querySelector<HTMLInputElement>('#site-search')!;
const results = document.querySelector<HTMLDivElement>('#search-results')!;

/* Search: Pagefind full text for articles and notes in production, local metadata otherwise. */
interface PageItem { kind: string; title: string; text: string; url: string; }
interface SearchHit { kind: string; title: string; url?: string; entryId?: string; excerpt?: string; }
interface PagefindData { url: string; excerpt: string; meta: Record<string, string | undefined>; }
interface Pagefind { search(query: string): Promise<{ results: { data(): Promise<PagefindData> }[] }>; }

const PAGEFIND_PATH = '/pagefind/pagefind.js';
const MAX_FULL_TEXT_HITS = 8;
const pageIndex: PageItem[] = JSON.parse(document.querySelector('#page-index')?.textContent ?? '[]');
let pagefind: Promise<Pagefind | null> | undefined;

const includes = (text: string, query: string): boolean => text.toLocaleLowerCase().includes(query);

function loadPagefind(): Promise<Pagefind | null> {
  if (!import.meta.env.PROD) return Promise.resolve(null);
  pagefind ??= import(/* @vite-ignore */ PAGEFIND_PATH).then(module => module as Pagefind).catch(() => null);
  return pagefind;
}

async function searchFullText(query: string): Promise<SearchHit[] | null> {
  const engine = await loadPagefind();
  if (!engine) return null;
  try {
    const response = await engine.search(query);
    const pages = await Promise.all(response.results.slice(0, MAX_FULL_TEXT_HITS).map(result => result.data()));
    return pages.map(page => ({ kind: page.meta.kind ?? '页面', title: page.meta.title ?? page.url, url: page.url, excerpt: page.excerpt }));
  } catch {
    return null;
  }
}

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

/**
 * Full-text hits first, then local metadata hits not already present. Pagefind's Chinese segmentation can miss
 * substrings such as "线程池", while titles, descriptions and tags always match by plain substring.
 */
function mergePageHits(fullText: SearchHit[], local: SearchHit[]): SearchHit[] {
  const seen = new Set(fullText.map(hit => normalizeUrl(hit.url!)));
  return [...fullText, ...local.filter(hit => !seen.has(normalizeUrl(hit.url!)))];
}

function searchLocal(query: string): SearchHit[] {
  const pages = pageIndex.filter(item => includes(`${item.title} ${item.text} ${item.kind}`, query));
  return pages.map(({ kind, title, url }) => ({ kind, title, url }));
}

function searchEntries(query: string): SearchHit[] {
  return entries
    .filter(entry => includes(`${entry.title} ${entry.description} ${entry.tags.join(' ')} ${entry.kind}`, query))
    .map(entry => ({ kind: entry.kind, title: entry.title, entryId: entry.id }));
}

function renderHit(hit: SearchHit): HTMLElement {
  const element = hit.url ? document.createElement('a') : document.createElement('button');
  element.className = 'search-result';
  if (element instanceof HTMLAnchorElement) element.href = hit.url!;
  else element.addEventListener('click', () => openEntry(hit.entryId!));
  const label = document.createElement('span');
  label.textContent = hit.kind;
  const title = document.createElement('strong');
  title.textContent = hit.title;
  element.append(label, title);
  if (hit.excerpt) {
    const excerpt = document.createElement('p');
    // Pagefind returns an HTML-escaped excerpt of our own pages with <mark> around matches.
    excerpt.innerHTML = hit.excerpt;
    element.append(excerpt);
  }
  return element;
}

let latestSearch = 0;
async function renderResults(): Promise<void> {
  const raw = searchInput.value.trim();
  const query = raw.toLocaleLowerCase();
  const searchId = ++latestSearch;
  const fullText = query ? await searchFullText(raw) : null;
  const pages = mergePageHits(fullText ?? [], searchLocal(query));
  if (searchId !== latestSearch) return;
  const hits = [...pages, ...searchEntries(query)];
  results.replaceChildren();
  if (!hits.length) {
    const empty = document.createElement('p');
    empty.className = 'search-empty';
    empty.textContent = `没有找到“${raw}”，试试 Agent、线程池或 Git。`;
    results.append(empty);
    return;
  }
  results.append(...hits.map(renderHit));
}

function openSearch(): void {
  entryDialog.close();
  void renderResults();
  if (!searchDialog.open) searchDialog.showModal();
  searchInput.focus();
}

document.querySelectorAll('.search-trigger').forEach(button => button.addEventListener('click', openSearch));
searchInput.addEventListener('input', () => void renderResults());
document.addEventListener('keydown', event => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
});

const heroForm = document.querySelector<HTMLFormElement>('#hero-search-form');
heroForm?.addEventListener('submit', event => {
  event.preventDefault();
  const heroInput = heroForm.querySelector<HTMLInputElement>('input')!;
  const query = heroInput.value.trim();
  if (!query) { heroInput.focus(); return; }
  searchInput.value = query;
  openSearch();
});

/* Reading preview */
function openEntry(id: string): void {
  const entry = entries.find(item => item.id === id);
  if (!entry) return;
  searchDialog.close();
  document.querySelector('#entry-kind')!.textContent = entry.kind;
  document.querySelector('#entry-title')!.textContent = entry.title;
  document.querySelector('#entry-description')!.textContent = entry.description;
  document.querySelector('#entry-text')!.replaceChildren(...entry.body.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  const source = document.querySelector<HTMLAnchorElement>('#entry-source')!;
  source.hidden = !entry.source;
  if (entry.source) { source.href = entry.source.url; source.textContent = `前往 ${entry.source.name} ↗`; } else { source.removeAttribute('href'); }
  if (!entryDialog.open) entryDialog.showModal();
  entryDialog.scrollTop = 0;
}

document.querySelectorAll<HTMLButtonElement>('.entry-trigger').forEach(button => button.addEventListener('click', () => openEntry(button.dataset.entry!)));

/* Dialog closing: a search input can consume Escape to clear its value before dialog.cancel. */
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  const dialog = entryDialog.open ? entryDialog : searchDialog.open ? searchDialog : null;
  if (dialog) { event.preventDefault(); dialog.close(); }
});
document.querySelectorAll<HTMLDialogElement>('dialog').forEach(dialog => {
  dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
});

/* Filters: each .filter-bar toggles [data-category] items inside its data-target. */
document.querySelectorAll<HTMLElement>('.filter-bar').forEach(bar => {
  const target = document.querySelector(bar.dataset.target!);
  const buttons = bar.querySelectorAll<HTMLButtonElement>('.filter-button');
  buttons.forEach(button => button.addEventListener('click', () => {
    buttons.forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); });
    target?.querySelectorAll<HTMLElement>('[data-category]').forEach(item => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.category !== button.dataset.filter;
    });
  }));
});

/* Theme */
const themeButton = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!;
function applyTheme(dark: boolean): void {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(dark));
  themeColor.content = dark ? '#141413' : '#faf9f5';
}
applyTheme(document.documentElement.dataset.theme === 'dark');
themeButton.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  applyTheme(dark);
  try { localStorage.setItem('notes-theme', dark ? 'dark' : 'light'); } catch {}
});

/* Mobile navigation */
const menuButton = document.querySelector<HTMLButtonElement>('.mobile-menu-toggle')!;
const mobileNav = document.querySelector<HTMLElement>('#mobile-nav')!;
menuButton.addEventListener('click', () => {
  mobileNav.hidden = !mobileNav.hidden;
  menuButton.setAttribute('aria-expanded', String(!mobileNav.hidden));
});
