// Imports Markdown notes written elsewhere (an Obsidian vault, another repository) into src/content/notes.
//   pnpm import-notes <源文件或目录> <主题目录> [--topic 主题名] [--publish] [--force]
// A directory imports its top-level .md files, except README.md and CLAUDE.md. Each note gets front matter
// built from the source (first "# 标题", first paragraph, git date), images it references are copied along,
// and links between notes become site URLs; links to notes that aren't on the site point at the source
// repository on GitHub. Imported notes start as drafts unless --publish is given.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const NOTES_ROOT = path.resolve('src/content/notes');
const SKIPPED_FILES = new Set(['readme.md', 'claude.md']);
const DATE_LINE = /^(?:创建日期|更新日期|日期)[:：]\s*(\d{4}-\d{2}-\d{2})\s*$/;

function fail(message) {
  console.error(`错误：${message}`);
  console.error('用法：pnpm import-notes <源文件或目录> <主题目录> [--topic 主题名] [--publish] [--force]');
  process.exit(1);
}

function parseArgs(argv) {
  const options = { publish: false, force: false, topic: null, positional: [] };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--publish') options.publish = true;
    else if (arg === '--force') options.force = true;
    else if (arg === '--topic') options.topic = argv[++index];
    else if (arg.startsWith('--')) fail(`未知参数 ${arg}`);
    else options.positional.push(arg);
  }
  if (options.positional.length !== 2) fail('需要源路径和主题目录两个参数。');
  return options;
}

/** Same shape as the ids Astro gives content files, so the file name is also the URL segment. */
const slugify = name => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_-]/gu, '');

const git = (cwd, ...args) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
};

/** Root, web URL and branch of the git repository holding `dir`, for links to notes left off the site. */
function sourceRepo(dir) {
  const root = git(dir, 'rev-parse', '--show-toplevel');
  if (!root) return { root: dir, blobUrl: null };
  const remote = git(root, 'remote', 'get-url', 'origin')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/\.git$/, '');
  const branch = git(root, 'rev-parse', '--abbrev-ref', 'HEAD') || 'main';
  return { root: path.resolve(root), blobUrl: remote.startsWith('https://') ? `${remote}/blob/${branch}` : null };
}

function splitFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return match ? { head: match[1], body: text.slice(match[0].length) } : { head: null, body: text };
}

/** Notes already on the site that were imported, by source path, so links between batches resolve. */
function importedNotes() {
  const byOrigin = new Map();
  if (!fs.existsSync(NOTES_ROOT)) return byOrigin;
  for (const file of fs.readdirSync(NOTES_ROOT, { recursive: true }).filter(name => name.endsWith('.md'))) {
    const { head } = splitFrontMatter(fs.readFileSync(path.join(NOTES_ROOT, file), 'utf8'));
    const origin = head?.match(/^origin:\s*"?(.+?)"?\s*$/m)?.[1];
    if (origin) byOrigin.set(origin, `/notes/${file.replace(/\\/g, '/').replace(/\.md$/, '')}`);
  }
  return byOrigin;
}

/** Title, date line and the rest of the body; the site prints the title itself. */
function takeHeader(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let title = null;
  let date = null;
  while (lines.length && !lines[0].trim()) lines.shift();
  if (/^#\s+/.test(lines[0] ?? '')) title = lines.shift().replace(/^#\s+/, '').trim();
  while (lines.length && !lines[0].trim()) lines.shift();
  const dateMatch = lines[0]?.match(DATE_LINE);
  if (dateMatch) {
    date = dateMatch[1];
    lines.shift();
  }
  return { title, date, body: lines.join('\n').replace(/^\n+/, '') };
}

/**
 * Description from the first prose paragraph. The article page prints the description as its lede, so a
 * short plain paragraph moves there whole and leaves the body; otherwise the first sentence is used and the
 * body stays as it is.
 */
function takeDescription(body) {
  const blocks = body.split(/\n\s*\n/);
  const index = blocks.findIndex(block => /^[^#>|`\-*!\d<$]/.test(block.trim()));
  if (index < 0) return { description: '', body };
  const paragraph = blocks[index].trim();
  const text = paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_$]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (index === 0 && text.length <= 150 && !/[[`$]/.test(paragraph)) {
    return { description: text, body: blocks.slice(1).join('\n\n').replace(/^\n+/, '') };
  }
  const stop = text.indexOf('。');
  const description = stop > 0 && stop < 120 ? text.slice(0, stop + 1) : text.length > 100 ? `${text.slice(0, 100)}…` : text;
  return { description, body };
}

/** Applies `rewrite` to Markdown link targets outside fenced code blocks and inline code. */
function rewriteLinks(body, rewrite) {
  let fence = null;
  return body.split('\n').map(line => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (marker && (!fence || (marker[0] === fence[0] && marker.length >= fence.length))) {
      fence = fence ? null : marker;
      return line;
    }
    if (fence) return line;
    return line.split(/(`+[^`]*`+)/).map((part, index) => (index % 2 ? part : part.replace(
      /(!?\[[^\]]*\]\()(<[^>]+>|[^)\s]+)(\s+"[^"]*")?\)/g,
      (all, open, target, title = '') => `${open}${rewrite(target.replace(/^<|>$/g, ''), open.startsWith('!'))}${title})`,
    ))).join('');
  }).join('\n');
}

const yaml = value => JSON.stringify(value);

/**
 * Rewrites one link target of `file`: notes on the site become site URLs, other notes point at the source
 * repository, and local files (images) are copied next to the imported note.
 */
function resolveLink({ repo, originOf, targetDir, siteUrlByOrigin, warnings, stats }, file, href, isImage) {
  if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href;
  const [rawPath, anchor = ''] = href.split('#');
  let decoded;
  try { decoded = decodeURI(rawPath); } catch { decoded = rawPath; }
  const linked = path.resolve(path.dirname(file), decoded);
  const hash = anchor ? `#${anchor}` : '';

  if (decoded.endsWith('.md')) {
    const siteUrl = siteUrlByOrigin.get(originOf(linked));
    if (siteUrl) {
      stats.siteLinks++;
      return siteUrl + hash;
    }
    if (!repo.blobUrl) {
      warnings.push(`${path.basename(file)}：${href} 不在站内，也找不到源仓库地址，保留原样`);
      return href;
    }
    stats.repoLinks++;
    return `${repo.blobUrl}/${encodeURI(originOf(linked))}${hash}`;
  }

  if (!fs.existsSync(linked)) {
    warnings.push(`${path.basename(file)}：找不到 ${href}`);
    return href;
  }
  // Keep the relative layout for files beside the note; anything outside goes to assets/.
  const fromNote = path.relative(path.dirname(file), linked);
  const relative = fromNote.startsWith('..') ? `assets/${path.basename(linked)}` : fromNote.replace(/\\/g, '/');
  fs.mkdirSync(path.dirname(path.join(targetDir, relative)), { recursive: true });
  fs.copyFileSync(linked, path.join(targetDir, relative));
  if (isImage) stats.images++;
  return /\s/.test(relative) ? `<${relative}>` : relative;
}

function importNote(context, { file, slug }) {
  const { options, repo, originOf, targetDir, topic, warnings, stats } = context;
  const target = path.join(targetDir, `${slug}.md`);
  const exists = fs.existsSync(target);
  if (exists && !options.force) {
    console.log(`跳过 ${path.relative(process.cwd(), target)}（已存在，用 --force 覆盖正文）`);
    stats.skipped++;
    return;
  }

  const { head: sourceHead, body: sourceBody } = splitFrontMatter(fs.readFileSync(file, 'utf8'));
  if (sourceHead) warnings.push(`${path.basename(file)}：源文件自带 front matter，已忽略，需要的字段请手动合并`);
  const { title, date, body } = takeHeader(sourceBody);
  const updated = git(repo.root, 'log', '-1', '--format=%cs', '--', file) || date || new Date().toISOString().slice(0, 10);
  const rewritten = rewriteLinks(body, (href, isImage) => resolveLink(context, file, href, isImage));
  if (/!?\[\[[^\]]+\]\]/.test(rewritten)) warnings.push(`${path.basename(file)}：含有 Obsidian 的 [[双链]]，网站不会转换，需要改成普通链接`);
  const { description, body: rest } = takeDescription(rewritten);

  // Re-importing keeps the front matter already edited on the site and only refreshes the date; the
  // opening paragraph stays out of the body only while it is still the description.
  const existingHead = exists ? splitFrontMatter(fs.readFileSync(target, 'utf8')).head : null;
  const keptDescription = existingHead?.match(/^description:\s*(.*)$/m)?.[1];
  const head = existingHead
    ? existingHead.replace(/^updated:.*$/m, `updated: ${updated}`)
    : [
        `title: ${yaml(title ?? path.basename(file, '.md'))}`,
        `description: ${yaml(description)}`,
        `topic: ${yaml(topic)}`,
        `updated: ${updated}`,
        'tags: []',
        `origin: ${yaml(originOf(file))}`,
        `draft: ${!options.publish}`,
      ].join('\n');
  const finalBody = !existingHead || keptDescription === yaml(description) ? rest : rewritten;

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(target, `---\n${head}\n---\n\n${finalBody.trimEnd()}\n`, 'utf8');
  console.log(`${exists ? '更新' : '导入'} ${path.relative(process.cwd(), target)}`);
  stats.imported++;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const [sourceArg, topicDir] = options.positional;
  const source = path.resolve(sourceArg);
  if (!fs.existsSync(source)) fail(`找不到 ${sourceArg}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topicDir)) fail('主题目录只能包含小写字母、数字和连字符，例如 agent。');

  const files = fs.statSync(source).isDirectory()
    ? fs.readdirSync(source)
      .filter(name => name.endsWith('.md') && !SKIPPED_FILES.has(name.toLowerCase()))
      .map(name => path.join(source, name))
    : [source];
  if (files.length === 0) fail(`${sourceArg} 下没有可导入的 .md 文件。`);

  const repo = sourceRepo(path.dirname(files[0]));
  const originOf = file => path.relative(repo.root, file).replace(/\\/g, '/');
  const targetDir = path.join(NOTES_ROOT, topicDir);
  const topic = options.topic ?? path.basename(path.dirname(files[0]));

  // Every note in this batch plus earlier imports, so links among them become site URLs.
  const siteUrlByOrigin = importedNotes();
  const batch = files.map(file => {
    const slug = slugify(path.basename(file, '.md'));
    siteUrlByOrigin.set(originOf(file), `/notes/${topicDir}/${slug}`);
    return { file, slug };
  });

  const context = { options, repo, originOf, targetDir, topic, siteUrlByOrigin, warnings: [], stats: { imported: 0, skipped: 0, siteLinks: 0, repoLinks: 0, images: 0 } };
  for (const note of batch) importNote(context, note);

  const { stats, warnings } = context;
  console.log(`\n完成：导入 ${stats.imported} 篇，跳过 ${stats.skipped} 篇；站内链接 ${stats.siteLinks} 个，指向源仓库 ${stats.repoLinks} 个，图片 ${stats.images} 张。`);
  if (!options.publish && stats.imported) console.log('新导入的笔记是草稿（draft: true），检查后改成 false 再发布。');
  for (const warning of warnings) console.warn(`注意：${warning}`);
}

main();
