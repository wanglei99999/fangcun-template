---
title: 长时间运行的 Agent，需要怎样的工作台
description: 任务会跨越多个上下文窗口时，进度记录、测试和交接文件分别起什么作用。
published: 2026-09-28
blog: Anthropic
source:
  name: Anthropic Engineering
  url: https://www.anthropic.com/engineering
tags: [Agent, Harness]
---

> 示例内容：用于展示同一来源下的多篇解读。

## 问题

一个任务做到一半，上下文窗口满了。新的会话要从哪里接着做？

## 做法

- **进度文件**：每完成一步就记录，新会话先读它
- **测试**：让"做完了"有客观标准
- **小步提交**：出问题时容易回退

```text title="progress.md"
- [x] 搭好项目骨架
- [x] 列表页
- [ ] 详情页：目录高亮还有问题
```

## 我的验证

在自己的项目里试了进度文件这个做法，新会话接手的时间明显缩短。
