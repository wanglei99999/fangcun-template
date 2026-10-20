---
title: 大型代码库里的搜索是怎么做的
description: 从索引结构到查询语言，看一个代码搜索系统如何面对海量仓库。
published: 2026-08-11
blog: GitHub
source:
  name: The GitHub Blog · Engineering
  url: https://github.blog/engineering/
tags: [搜索, 工程实践]
---

> 示例内容。

## 读法

这类长文适合拆成三部分来读：问题规模、核心设计、可借鉴的点。

## 可借鉴的点

- 先按需求定索引粒度，再谈查询语法
- 静态站点也能做全文搜索：构建时生成索引，浏览器按需加载分片

本站的全文搜索就用了这个思路：

::github{repo="CloudCannon/pagefind"}
