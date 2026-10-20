---
title: Git 工作流与常用命令备忘
description: 查看历史、隔离修改、整理提交，以及定位问题。
topic: 工程实践
updated: 2026-08-26
tags: [Git, 工程实践]
---

> 示例笔记：用于展示随时查阅的操作备忘。

## 查看历史

```bash
git log --oneline --graph -20
git log -p -- path/to/file   # 某个文件的修改历史
```

## 隔离修改

```bash
git switch -c feature/search   # 新分支
git stash push -m "临时保存"     # 暂存未完成的修改
```

## 定位问题

```bash
git bisect start
git bisect bad            # 当前版本有问题
git bisect good v1.2.0    # 这个版本是好的
```
