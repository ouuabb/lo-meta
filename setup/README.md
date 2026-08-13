# lo 生态 · 本机复现指南（setup）

本目录用于**完整复现本机的 lo 生态工作区 + opencode 配置**——即使
`C:\Users\admin\Downloads\lo` 目录甚至 opencode 全局配置被删除，也能按步骤恢复。

## 为什么需要本目录

lo 生态的**代码与仓库内配置**都在 git（克隆即可）；但有几处**不在 git 内**、只在机器上，
删除后无法直接恢复：

| 项 | 位置 | 是否 git | 处理 |
|---|---|---|---|
| 工作区根 `AGENTS.md` | `<workspace>/AGENTS.md`（工作区根非仓库） | ❌ | 备份见 [`configs/workspace-AGENTS.md`](configs/workspace-AGENTS.md) |
| opencode 全局配置 | `~/.config/opencode/opencode.jsonc` | ❌ | 备份见 [`configs/opencode.global.jsonc`](configs/opencode.global.jsonc) |
| 工作区目录布局（`log/`=lo 等） | `<workspace>/` | 部分 | 见 [`workspace.md`](workspace.md) |
| GitHub Pages（线上文档中心） | GitHub 仓库设置 | — | 手动步骤见 [`pages.md`](pages.md) |
| 各仓库 `opencode.json`（references） | 各仓库内 | ✅ 已提交 | 克隆即得 |
| lo-meta 文档中心 / 总纲 / 规格 | `docs/`（本仓库） | ✅ 已提交 | 克隆即得 |

## 复现步骤（总览）

1. **准备环境**：Node ≥ 20（推荐 22）、Yarn（lo 生态用）、git。
2. **克隆仓库**（见 [`workspace.md`](workspace.md)）——8 个仓库按速览表布局到同一工作区。
3. **恢复机器级配置**：运行 `node restore.cjs`（复制/生成配置文件到目标路径，
   见 [`restore.cjs`](restore.cjs)），或按 [`opencode.md`](opencode.md) 手工配置。
4. **安装依赖**：各仓库 `npm install` / `yarn install`（`node_modules` 不入库）。
5. **重启 opencode**（全局 instructions 生效）。
6. **线上文档中心**（可选）：按 [`pages.md`](pages.md) 启用 GitHub Pages。

## 各步骤详情

- [`workspace.md`](workspace.md) —— 工作区布局与克隆/重建
- [`opencode.md`](opencode.md) —— opencode 全局 + 项目配置（本机）复现
- [`pages.md`](pages.md) —— GitHub Pages 线上文档中心

## 恢复脚本

```bash
node restore.cjs     # 从 configs/ 恢复机器级配置（可安全重复执行）
```

> 脚本会：把 `configs/workspace-AGENTS.md` 复制为工作区根 `AGENTS.md`；把全局 opencode
> 配置写入 `~/.config/opencode/opencode.jsonc`（`instructions` 指向本仓库总纲，
> 路径按脚本所在位置自动推导，不依赖硬编码）。
