# lo 生态文档总入口（lo-meta）

本仓库聚合 lo 生态**全部文档**——**一个仓库看所有文档**：生态总纲、规格、各仓库文档。

## 生态总纲（唯一权威）

- [`ecosystem/AGENTS.md`](ecosystem/AGENTS.md) —— 全生态唯一权威总纲：
  契约铁律 §1、各仓库速查 §2、开发流程 §3、测试 §4、文档 §5、审查 §6、陷阱 §7、
  边界速查 §8、版本节奏 §9、协议概念 §10、快速开始 §11、**不可触犯边界 §12（7 类）**。

## 生态规格

`specs/` —— 按编号的规格与审计文档：

| 编号 | 主题 |
|---|---|
| 001 | 执行上下文协议 |
| 002 | lo Core 能力协议 |
| 003 | lo-client-sdk 协议 |
| 004 | lo-agent 架构 |
| 005 / 011 | lo-agent 实现审计 |
| 006 | 生态架构与边界审计 |
| 007 | lo Core 实现审计 |
| 008 / 013 | 插件系统架构/审计 |
| 009 | client-sdk 审计 |
| 010 | Phase 1 Core 协议收敛计划 |
| 012 | 插件运行时架构 |

## 各仓库文档（聚合）

由 [`scripts/sync.cjs`](scripts/sync.cjs) 从各仓库 `docs/` 同步，保持与代码同步源一致。

| 仓库 | 聚合位置 |
|---|---|
| lo-agent-plugins（客户端插件仓库） | [`repos/lo-agent-plugins/`](repos/lo-agent-plugins/index.md) |
| （未来：lo-agent / lo-client-sdk / lo-plugins / …） | — |

## 使用方式

- 各仓库根 `AGENTS.md` 为**薄入口**；opencode 全局配置
  （`~/.config/opencode/opencode.jsonc` → `instructions`）自动加载总纲。
- 各仓库 `opencode.json` 的 `references` 指向本仓库（`ouuabb/lo-meta`），
  独立克隆任一仓库也能获得总纲与规格上下文。

## 聚合维护

```bash
node scripts/sync.cjs   # 重新聚合各仓库 docs/ → repos/<name>/（幂等）
```

改动生态文档（总纲/规格/聚合）后：更新对应仓库源文档 → 跑 sync → 提交本仓库。
