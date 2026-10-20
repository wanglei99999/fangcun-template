/**
 * Site identity. When starting a new site from this template, this file and src/content/ are the
 * only places that need your details.
 */
export const site = {
  name: '方寸之间',
  /** Home hero heading; each clause is kept on one line. */
  motto: ['方寸之间见天地，', '细微之处有乾坤。'],
  /** Follows the name in the home page's browser title. */
  titleTagline: '细微之处有乾坤',
  /** Default meta description. */
  description: '工程博客解读、个人知识库、开源仓库、Skills 与工具收藏。',
  /** One line under the name in the footer. */
  intro: '读工程博客，记自己的笔记，收藏好用的东西。',
  author: '方寸之间',
  /** GitHub username; leave empty until you have one to link. */
  github: '',
  since: 2026,
  /** License for the owner's own notes. Reading notes on other blogs credit the original instead. */
  license: {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
  },
} as const;

export const githubUrl = site.github ? `https://github.com/${site.github}` : 'https://github.com/';
