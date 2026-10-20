// Articles and notes live in src/content as Markdown. This file holds the list-style sections.

export type Kind = '仓库' | 'Skill' | '工具箱';

export interface Link {
  name: string;
  url: string;
}

/** Shared shape for anything that opens in the reading-preview dialog. */
export interface Entry {
  id: string;
  kind: Kind;
  title: string;
  description: string;
  tags: string[];
  body: string[];
  source?: Link;
}

export interface Repo extends Entry { repo: string; }
export interface Tool extends Entry { category: string; url: string; }

export interface BlogSource {
  name: string;
  note: string;
  url: string;
}

export interface Project {
  repo: string;
  title: string;
  tagline: string;
  features: string[];
  tags: string[];
  intro: string;
}

// Preview content. Replace with the owner's real metadata later.

/** 博客来源：文章页侧栏展示。 */
export const blogSources: BlogSource[] = [
  { name: 'Anthropic Engineering', note: 'Claude 与 Agent 工程实践', url: 'https://www.anthropic.com/engineering' },
  { name: 'OpenAI Codex', note: '开发工具与官方技术资料', url: 'https://developers.openai.com/codex/' },
  { name: 'The Cloudflare Blog', note: '网络、边缘计算与基础设施', url: 'https://blog.cloudflare.com/' },
  { name: 'The GitHub Blog', note: '开发者工具与工程文化', url: 'https://github.blog/engineering/' },
];

/** 仓库：GitHub 上关注、常用或在研究的开源仓库。 */
export const repos: Repo[] = [
  { id: 'repo-claude-code', kind: '仓库', repo: 'anthropics/claude-code', title: 'claude-code', description: '在终端里工作的 AI 编程助手。', tags: ['AI', 'CLI'], body: ['示例收藏说明：这里写为什么关注这个仓库、看过哪些部分。'], source: { name: 'GitHub', url: 'https://github.com/anthropics/claude-code' } },
  { id: 'repo-astro', kind: '仓库', repo: 'withastro/astro', title: 'astro', description: '以内容为中心的 Web 框架，本站就用它构建。', tags: ['Web', '框架'], body: ['示例收藏说明。'], source: { name: 'GitHub', url: 'https://github.com/withastro/astro' } },
  { id: 'repo-pagefind', kind: '仓库', repo: 'CloudCannon/pagefind', title: 'pagefind', description: '给静态站点用的全文搜索，构建时生成索引。', tags: ['搜索', '静态站'], body: ['示例收藏说明。'], source: { name: 'GitHub', url: 'https://github.com/CloudCannon/pagefind' } },
  { id: 'repo-smolagents', kind: '仓库', repo: 'huggingface/smolagents', title: 'smolagents', description: '用代码表达动作的轻量 Agent 库。', tags: ['AI', 'Agent'], body: ['示例收藏说明。'], source: { name: 'GitHub', url: 'https://github.com/huggingface/smolagents' } },
  { id: 'repo-mem0', kind: '仓库', repo: 'mem0ai/mem0', title: 'mem0', description: '给 AI 应用加上长期记忆层。', tags: ['AI', '记忆'], body: ['示例收藏说明。'], source: { name: 'GitHub', url: 'https://github.com/mem0ai/mem0' } },
  { id: 'repo-mcp-servers', kind: '仓库', repo: 'modelcontextprotocol/servers', title: 'servers', description: 'MCP 官方维护的参考服务器集合。', tags: ['MCP', 'AI'], body: ['示例收藏说明。'], source: { name: 'GitHub', url: 'https://github.com/modelcontextprotocol/servers' } },
];

/** Skills：自己保留和打磨的 Skills。 */
export const skills: Entry[] = [
  { id: 'code-reading', kind: 'Skill', title: 'code-reading', description: '先读懂项目，再开始动手。', tags: ['代码理解'], body: ['示例 Skill，用于预览介绍与使用说明。', '可以在这里说明适用场景、输入要求、执行步骤和安装方法。'] },
  { id: 'technical-writing', kind: 'Skill', title: 'technical-writing', description: '把技术实践写成清楚的文字。', tags: ['技术写作'], body: ['示例 Skill。'] },
  { id: 'daily-review', kind: 'Skill', title: 'daily-review', description: '整理一天的工作，留住有用的经验。', tags: ['工作复盘'], body: ['示例 Skill。'] },
  { id: 'new-feature', kind: 'Skill', title: 'new-feature', description: '先讨论方案，确认后再实现。', tags: ['开发流程'], body: ['示例 Skill。'] },
];

const tool = (id: string, category: string, title: string, description: string, url: string): Tool =>
  ({ id, kind: '工具箱', category, title, description, url, tags: [category], body: [description], source: { name: title, url } });

/** 工具箱：网上收藏的好用工具与资料。 */
export const tools: Tool[] = [
  tool('excalidraw', '绘图', 'Excalidraw', '手绘风格的白板，把想法画出来', 'https://excalidraw.com/'),
  tool('tldraw', '绘图', 'tldraw', '无限画布，画流程图和草图', 'https://www.tldraw.com/'),
  tool('regex101', '开发', 'Regex101', '正则表达式的试验田', 'https://regex101.com/'),
  tool('caniuse', '开发', 'Can I use', '查浏览器对新特性的支持情况', 'https://caniuse.com/'),
  tool('squoosh', '开发', 'Squoosh', '在浏览器里压缩和转换图片', 'https://squoosh.app/'),
  tool('mdn', '文档', 'MDN Web Docs', '常翻常新的开发手册', 'https://developer.mozilla.org/zh-CN/'),
  tool('devdocs', '文档', 'DevDocs', '多种技术文档的离线聚合', 'https://devdocs.io/'),
];

/** 关于页：自己的项目。 */
export const projects: Project[] = [
  {
    repo: 'your-name/notes-garden', title: 'notes-garden', tagline: '给 Markdown 笔记一个可以慢慢生长的家。',
    features: ['Markdown 仓库直接生成站点', '文章、知识库、仓库分栏浏览', '静态部署到 Cloudflare'], tags: ['Astro', 'TypeScript'],
    intro: '示例项目。接入你的 GitHub 后，这里可以放真实的项目说明、截图、技术选型和仓库地址。',
  },
  {
    repo: 'your-name/dev-toolkit', title: 'dev-toolkit', tagline: '把开发中反复用到的小工具，收进同一个工具箱。',
    features: ['常用脚本集中管理', '命令行一键调用'], tags: ['工具集', '效率'],
    intro: '示例项目。正式内容可包含项目解决的问题、使用方式、演示地址与源码链接。',
  },
];

export const guestbook = [
  { name: '路过的人', text: '排版很舒服，收藏了。' },
  { name: 'Baber', text: '知识库的分类方式值得借鉴。' },
  { name: '方寸之间', text: '欢迎留言，想到什么都可以写。' },
];

/** Items that open in the reading-preview dialog and are searched locally. */
export const entries: Entry[] = [...repos, ...skills, ...tools];
