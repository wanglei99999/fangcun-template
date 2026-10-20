// Scaffolds a new article or note with complete front matter. Idea from Fuwari's scripts/new-post.js (MIT License).
//   pnpm new-post <slug> [标题]
//   pnpm new-note <topic>/<slug> [标题]
// New files start as drafts: visible in `pnpm dev`, left out of `pnpm build` until `draft: false`.
import fs from 'node:fs';
import path from 'node:path';

const SLUG_SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const [kind, slugArg, titleArg] = process.argv.slice(2);

function fail(message) {
  console.error(`错误：${message}`);
  console.error('用法：pnpm new-post <slug> [标题]   或   pnpm new-note <主题目录>/<slug> [标题]');
  process.exit(1);
}

function today() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}

/** Reuse the `topic:` of an existing note in the same folder, so new notes land in the same group. */
function existingTopic(folder) {
  if (!fs.existsSync(folder)) return null;
  for (const file of fs.readdirSync(folder).filter(name => name.endsWith('.md'))) {
    const match = fs.readFileSync(path.join(folder, file), 'utf8').match(/^topic:\s*(.+)$/m);
    if (match) return match[1].trim();
  }
  return null;
}

const quote = text => JSON.stringify(text);

if (kind !== 'post' && kind !== 'note') fail('第一个参数必须是 post 或 note。');
if (!slugArg) fail('缺少文件名。');
const segments = slugArg.replace(/\.md$/i, '').split('/');
if (!segments.every(segment => SLUG_SEGMENT.test(segment))) fail(`“${slugArg}”只能包含小写字母、数字和连字符，用 / 分隔目录。`);
if (kind === 'note' && segments.length < 2) fail('笔记需要放在主题目录下，例如 java/thread-local。');

const base = kind === 'post' ? 'src/content/posts' : 'src/content/notes';
const target = path.join(base, ...segments) + '.md';
if (fs.existsSync(target)) fail(`${target} 已存在。`);

const title = titleArg ?? segments.at(-1);
const date = today();
const frontMatter = kind === 'post'
  ? [
      `title: ${quote(title)}`,
      `description: ""`,
      `published: ${date}`,
      `blog: ""              # 来源简称，用于筛选，例如 Anthropic`,
      `source:`,
      `  name: ""            # 原文所在的博客名`,
      `  url: https://example.com/  # 原文链接`,
      `tags: []`,
      `draft: true`,
    ]
  : [
      `title: ${quote(title)}`,
      `description: ""`,
      `topic: ${quote(existingTopic(path.dirname(target)) ?? segments[0])}`,
      `updated: ${date}`,
      `tags: []`,
      `draft: true`,
    ];

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `---\n${frontMatter.join('\n')}\n---\n\n`, 'utf8');
console.log(`已创建 ${target}（草稿）`);
