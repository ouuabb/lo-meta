# opencode 配置复现（本机）

本机 opencode 相关配置分两层：**全局**（机器级，不在任何 git 仓库）与**项目**（在各仓库内，已提交）。

## 1. 全局配置（机器级，需恢复）

文件：`~/.config/opencode/opencode.jsonc`

当前值（备份见 [`configs/opencode.global.jsonc`](configs/opencode.global.jsonc)）：

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": ["<workspace>/docs/ecosystem/AGENTS.md"]
}
```

作用：让 opencode 在**任意项目会话**自动加载 lo 生态总纲（含不可触犯边界 §12）。
`<workspace>` 为工作区根（本机为 `C:/Users/admin/Downloads/lo`）。

> `instructions` 路径按机器绝对路径写入；若工作区迁移到别处，需同步改该路径。
> `node restore.cjs` 会自动按脚本所在位置推导 `<workspace>`，无需手改。

## 2. 项目级配置（仓库内，克隆即得）

每个 lo 生态仓库根都有 `opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "references": {
    "lo-meta": {
      "repository": "ouuabb/lo-meta",
      "branch": "main",
      "description": "lo 生态权威文档仓库：总纲（ecosystem/AGENTS.md，含不可触犯边界 §12）、规格、各仓库聚合文档"
    }
  }
}
```

作用：独立克隆任一仓库时，opencode 也能通过 `references` 拿到 lo-meta 文档上下文。
已提交，无需手工恢复。

## 3. 生效

opencode 配置在启动时加载，**不热更新**——改动后需退出并重启 opencode。

## 4. 恢复方式

```bash
cd <workspace>/docs
node setup/restore.cjs     # 自动重写 ~/.config/opencode/opencode.jsonc（instructions 指向当前工作区）
```

或手工：把 `configs/opencode.global.jsonc` 复制到 `~/.config/opencode/opencode.jsonc`，
并把其中 `<workspace>` 换成实际路径。

## 5. 相关文件清单（本机）

| 文件 | 归属 | 恢复来源 |
|---|---|---|
| `~/.config/opencode/opencode.jsonc` | 机器级 | `configs/opencode.global.jsonc`（或 restore.cjs） |
| `<workspace>/AGENTS.md` | 机器级（工作区根） | `configs/workspace-AGENTS.md`（或 restore.cjs） |
| 各仓库 `opencode.json` | 仓库内 | git 克隆 |
| 各仓库 `AGENTS.md`（薄入口） | 仓库内 | git 克隆 |
| `docs/ecosystem/AGENTS.md`（总纲） | lo-meta | git 克隆 |
