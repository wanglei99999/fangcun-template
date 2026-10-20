# 方寸之间 · 博客模板

> 方寸之间见天地，细微之处有乾坤。

一个用 Astro 构建的中文个人博客与笔记站模板，纯静态，可直接部署到 Cloudflare。仓库里的文章、笔记和列表都是示例内容。

## 特性

- **五个栏目**：文章（工程博客解读，附原文链接）、知识库（按主题归档的笔记）、仓库、Skills、工具箱，外加归档页和关于页
- **阅读体验**：阅读时间、滚动高亮的目录、Expressive Code 代码块（行号、折叠、复制、语言标签）、KaTeX 数学公式、图片点击放大、标题锚点、提示框、GitHub 仓库卡片、文末版权声明
- **搜索**：Pagefind 全文检索，并合并标题、简介、标签的子串匹配，弥补中文分词的不足
- **视觉**：暖白配近黑的排版体系、按页面地址生成的几何插画、首页和 404 页的点阵标题动画，支持深色模式和减少动态效果
- **其他**：RSS、Sitemap、robots.txt、404 页、新建文章脚本、Playwright 端到端测试

## 快速开始

需要 Node.js 22.22 或更高版本，以及 pnpm 11（`package.json` 里锁定了 `packageManager`，可以用 `corepack enable` 自动启用）。

```sh
pnpm install
pnpm dev          # 本地开发：http://127.0.0.1:4321
pnpm build        # 构建到 dist/，并生成 Pagefind 搜索索引
pnpm preview      # 预览构建结果（全文搜索只在这里可用）
```

## 用这个模板建自己的站

推荐克隆后推到你自己的新仓库，而不是用 GitHub 的 "Use this template" 按钮。这样两个仓库共享历史，以后模板有改进时可以直接合并过来。

```sh
git clone https://github.com/wanglei99999/fangcun-template.git my-site
cd my-site
git remote rename origin upstream
git remote add origin https://github.com/<你的账号>/<你的仓库>.git
git push -u origin main

# 以后同步模板的更新
git pull upstream main
```

然后改这几处：

| 位置 | 改什么 |
| --- | --- |
| `src/data/site.ts` | 站名、首页标语、简介、作者、GitHub 用户名、文章许可协议 |
| `src/content/posts/`、`src/content/notes/` | 换成你的文章和笔记 |
| `src/data/content.ts` | 仓库、Skills、工具箱、关于页的项目和留言 |
| `public/` | 网站图标（`favicon.svg`、`favicon-32.png`、`apple-touch-icon.png`） |
| `src/components/SiteFooter.astro` | 内容换成真的之后，删掉"此站为设计预览，内容均为示例" |
| `tests/e2e/` | 部分测试断言了示例内容（标题、篇数），换内容时一并更新 |

## 写作

```sh
pnpm new-post agent-memory "标题"          # 新建 src/content/posts/agent-memory.md
pnpm new-note java/thread-local "标题"     # 新建 src/content/notes/java/thread-local.md
```

新文件默认是 `draft: true`：在 `pnpm dev` 里可见，`pnpm build` 不会发布，写完改成 `false`。新笔记会沿用同目录下已有笔记的主题名。frontmatter 的字段定义在 `src/content.config.ts`。

### Markdown 扩展

```md
:::tip[可选标题]
提示框，类型有 note / tip / important / warning / caution。
:::

> [!WARNING]
> GitHub 风格的写法同样支持。

::github{repo="owner/name"}

行内公式 $E = mc^2$，行间公式：

$$
\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}
$$

![图片说明，也是放大后的替代文字](./diagram.svg)
```

````md
```python title="hybrid.py" collapse={1-5}
# 第 1–5 行默认折叠；代码块默认显示行号，命令行和纯文本除外
```
````

## 测试

```sh
pnpm test                 # 构建后运行全部端到端测试
pnpm test:e2e             # 已经构建过时，只跑测试
```

测试会自动启动 `astro preview`。第一次运行前用 `pnpm exec playwright install chromium` 下载浏览器；也可以设置 `PW_CHANNEL=msedge`（或 `chrome`）改用本机已装的浏览器。

## 部署到 Cloudflare

- 构建命令：`pnpm build`，输出目录：`dist`
- 环境变量：`NODE_VERSION=24`，`SITE_URL=https://你的域名`（RSS、Sitemap、canonical 链接都会用到）
- Cloudflare Pages 会自动把 `404.html` 用作 404 页；如果用 Workers 部署，需要在配置里设置 `not_found_handling = "404-page"`
- `*.pages.dev` 在国内访问不稳定，建议绑定自己的域名

## 目录结构

```text
src/
  content/            文章与笔记（Markdown）
  content.config.ts   frontmatter 定义
  data/site.ts        站点信息
  data/content.ts     仓库、Skills、工具箱、关于页数据
  layouts/            BaseLayout（全站）、ArticleLayout（详情页）
  components/         列表、页头页脚、目录、点阵标题、插画等
  pages/              路由
  plugins/            remark / rehype / Expressive Code 插件
  scripts/            浏览器端脚本：搜索、点阵标题、灯箱、GitHub 卡片
  styles/             样式
  utils/              内容查询、插画生成
scripts/new-content.mjs   新建文章脚本
tests/e2e/                Playwright 测试
```

## 已知限制

- 关于页的 GitHub 提交日历是占位数据
- 留言墙和点子收集箱只有界面，表单是禁用状态，需要接入后端（比如 Cloudflare D1）后才能用

## 许可与致谢

代码以 [MIT 许可](./LICENSE) 发布。`src/content/` 里的文章按各篇文末声明的协议授权。

文章阅读相关的功能参考并移植自 [Fuwari](https://github.com/saicaca/fuwari)（MIT 许可，© saicaca），包括：阅读时间插件、提示框与指令插件、GitHub 卡片结构、目录高亮思路、RSS 和 robots 端点、Expressive Code（语言标签、行号、代码折叠）、Pagefind、KaTeX 与 PhotoSwipe 的配置、文末版权声明和新建文章脚本。版式参考了 Anthropic 官网与工程博客的排版体系，没有使用其名称、Logo、专有字体或插画。
