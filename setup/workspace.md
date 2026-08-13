# 工作区布局与克隆 / 重建

## 目录布局（本机约定）

工作区根（如 `C:\Users\admin\Downloads\lo`）下并列放置：

| 本地目录名 | 仓库（GitHub 组织 `ouuabb`） | 角色 |
|---|---|---|
| `log/` | `ouuabb/lo` | lo Core（世界模型 + 能力中心） |
| `lo-client-sdk/` | `ouuabb/lo-client-sdk` | `@lo/client` |
| `lo-plugins-sdk/` | `ouuabb/lo-plugins-sdk` | `@lo/plugins-sdk` |
| `lo-plugins/` | `ouuabb/lo-plugins` | Core 插件源码 + 分发 |
| `lo-agent/` | `ouuabb/lo-agent` | Electron 桌面端 + 插件宿主 |
| `lo-agent-plugins-sdk/` | `ouuabb/lo-agent-plugins-sdk` | `@lo/agent-plugins-sdk` |
| `lo-agent-plugins/` | `ouuabb/lo-agent-plugins` | 客户端插件源码 + 分发 |
| `docs/` | `ouuabb/lo-meta` | **本仓库**：生态文档中心（总纲 + 规格 + 聚合文档 + setup） |

> 注意目录名与仓库名的映射：`lo` → `log/`、`lo-meta` → `docs/`（历史约定，见总纲 §0）。
> `file:` 依赖（`@lo/client`、`@lo/agent-plugins-sdk`）与 CI 检出都按同级目录布局工作。

## 克隆命令

```bash
mkdir <workspace> && cd <workspace>
git clone git@github.com:ouuabb/lo.git            log
git clone git@github.com:ouuabb/lo-client-sdk.git
git clone git@github.com:ouuabb/lo-plugins-sdk.git
git clone git@github.com:ouuabb/lo-plugins.git
git clone git@github.com:ouuabb/lo-agent.git
git clone git@github.com:ouuabb/lo-agent-plugins-sdk.git
git clone git@github.com:ouuabb/lo-agent-plugins.git
git clone git@github.com:ouuabb/lo-meta.git        docs
```

## 删除后重建（工作区整删）

1. 按上表克隆 8 个仓库（HTTPS/SSH 均可；SSH 需已配置 GitHub key）。
2. 运行 `node docs/setup/restore.cjs`（把工作区根 `AGENTS.md` 与 opencode 全局配置恢复到位；
   见 [`README.md`](README.md)）。
3. 各仓库装依赖：
   - lo / lo-client-sdk / lo-plugins-sdk / lo-agent-plugins-sdk：`npm install`
   - lo-plugins / lo-agent / lo-agent-plugins：`yarn install`（或 `npm install`）
   - `docs`（lo-meta）：`npm ci`（vitepress，需 `npm run docs:build` 验证）
4. lo-agent 的 `file:` 依赖（`@lo/client`、`@lo/agent-plugins-sdk`）会在安装时从同级目录解析。
5. 验证：
   - `docs`：`npm run docs:build` 成功；`npm run docs:dev` 后访问 `http://localhost:5173/lo-meta/`
   - lo-agent：`npm test` 全绿
   - 各仓库 `git log` 正常

## 说明

- 各仓库根 `AGENTS.md` 为薄入口（克隆自带）；工作区根 `AGENTS.md` 是唯一需手工恢复的
  非 git 文件（备份在 `configs/workspace-AGENTS.md`，与 `ecosystem/workspace-entry.md` 模板同源）。
- 机器上与本工作区无关的临时产物（如 `lo-test-repo/` 运行时数据）不在恢复范围。
