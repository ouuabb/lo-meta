# lo-meta

lo 生态**权威文档聚合仓库**——**一个仓库看所有文档**：生态总纲、规格、各仓库文档。

## 结构

| 路径 | 内容 |
|---|---|
| `index.md` | **文档总入口（portal）**：总纲 / 规格 / 各仓库聚合文档一览 |
| `ecosystem/AGENTS.md` | **生态总纲**（唯一权威）：契约铁律 §1、各仓库速查 §2、开发流程 §3、测试 §4、文档 §5、审查 §6、陷阱 §7、边界速查 §8、版本节奏 §9、协议概念 §10、快速开始 §11、**不可触犯边界 §12（7 类）** |
| `specs/` | 生态规格文档（001–013：能力协议 / 边界审计 / 插件系统 / 收敛计划 等） |
| `repos/<name>/` | **各仓库文档镜像**（由 `scripts/sync.cjs` 从各仓库 `docs/` 聚合，勿手改） |
| `scripts/sync.cjs` | 聚合脚本：各仓库 docs/ → `repos/<name>/`（幂等） |

## 如何使用

- **opencode**：全局 `~/.config/opencode/opencode.jsonc` → `instructions` 指向
  `ecosystem/AGENTS.md`，所有项目会话自动加载；各仓库 `opencode.json` 的
  `references` 亦指向本仓库（`ouuabb/lo-meta`），独立克隆任一仓库也能获得文档上下文。
- **各仓库 AGENTS.md**：为薄入口，指向本仓库总纲。
- 本仓库本地目录名为 `docs/`（与 `lo` 仓库目录名 `log/` 同理，远程名 `lo-meta`）。

## 聚合维护

```bash
node scripts/sync.cjs   # 重新聚合各仓库 docs/ → repos/<name>/
```

- 各仓库文档是「代码旁的事实源」；lo-meta 的 `repos/` 是镜像。
- 改文档：先改对应仓库源 → 跑 sync → 提交 lo-meta。

## 变更纪律

- 总纲/规格改动需经审查，并同步检查各仓库薄入口与 references 是否仍一致。
- 环境无关：文档只用仓库名，不依赖本地目录布局（聚合脚本除外，它是维护工具）。
