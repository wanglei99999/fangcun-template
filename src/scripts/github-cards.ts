// Fills ::github cards with live repository data. Cards stay usable as plain links if the API is unreachable.

interface RepoInfo {
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  owner: { avatar_url: string };
}

const CACHE_PREFIX = 'gh-card:';
const CACHE_TTL_MS = 60 * 60 * 1000;
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function readCache(repo: string): RepoInfo | null {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_PREFIX + repo) ?? 'null');
    return cached && Date.now() - cached.time < CACHE_TTL_MS ? cached.info : null;
  } catch {
    return null;
  }
}

function writeCache(repo: string, info: RepoInfo): void {
  try { sessionStorage.setItem(CACHE_PREFIX + repo, JSON.stringify({ time: Date.now(), info })); } catch {}
}

async function fetchRepo(repo: string): Promise<RepoInfo> {
  const cached = readCache(repo);
  if (cached) return cached;
  const response = await fetch(`https://api.github.com/repos/${repo}`, { referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${repo}`);
  const info: RepoInfo = await response.json();
  writeCache(repo, info);
  return info;
}

function fill(card: HTMLElement, info: RepoInfo): void {
  const set = (selector: string, text: string): void => {
    const element = card.querySelector<HTMLElement>(selector);
    if (element) element.textContent = text;
  };
  set('.gc-description', info.description?.replace(/:[a-z0-9_+-]+:/gi, '').trim() || '没有填写简介');
  set('.gc-stars', `★ ${compact.format(info.stargazers_count)}`);
  set('.gc-forks', `⑂ ${compact.format(info.forks_count)}`);
  set('.gc-language', info.language ?? '');
  set('.gc-license', info.license?.spdx_id ?? '');
  const avatar = card.querySelector<HTMLElement>('.gc-avatar');
  if (avatar) avatar.style.backgroundImage = `url("${encodeURI(info.owner.avatar_url)}")`;
  card.classList.add('loaded');
}

document.querySelectorAll<HTMLElement>('.github-card[data-repo]').forEach(card => {
  fetchRepo(card.dataset.repo!)
    .then(info => fill(card, info))
    .catch(() => card.classList.add('failed'));
});
