---
title: Java 并发：从线程到线程池
description: 线程生命周期、任务提交、线程池参数和关闭行为。
topic: Java
updated: 2026-10-08
tags: [Java, 并发]
---

> 示例笔记：用于展示知识库详情页的排版。接入真实仓库后会替换成你的原文。

## 线程的生命周期

一个线程会经历 `NEW`、`RUNNABLE`、`BLOCKED`、`WAITING`、`TIMED_WAITING`、`TERMINATED` 几种状态。直接 `new Thread()` 简单，但每个任务都新建线程，开销大，也难以管理。

## 线程池

### 核心参数

```java title="PoolConfig.java"
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                              // corePoolSize：常驻线程数
    8,                              // maximumPoolSize：最大线程数
    60, TimeUnit.SECONDS,           // keepAliveTime：非核心线程空闲多久回收
    new ArrayBlockingQueue<>(100),  // 任务队列
    new ThreadPoolExecutor.CallerRunsPolicy() // 拒绝策略
);
```

| 参数 | 作用 | 常见误区 |
| --- | --- | --- |
| `corePoolSize` | 常驻线程数 | 设得太大，空闲时浪费资源 |
| `maximumPoolSize` | 队列满后才会扩到这个数 | 用无界队列时永远不会生效 |
| `workQueue` | 存放等待执行的任务 | 无界队列可能撑爆内存 |

> [!IMPORTANT]
> 用无界队列（如不带容量的 `LinkedBlockingQueue`）时，`maximumPoolSize` 永远不会生效。

### 任务提交的顺序

1. 线程数小于 `corePoolSize`：新建线程执行
2. 否则放进队列
3. 队列满了，线程数小于 `maximumPoolSize`：新建线程
4. 都满了：执行拒绝策略

## 正确关闭

```java
executor.shutdown();
if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
    executor.shutdownNow();
}
```

`shutdown()` 不再接收新任务，但会执行完队列里的任务；`shutdownNow()` 会尝试中断正在执行的任务。
