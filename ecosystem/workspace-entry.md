# 工作区入口模板（AGENTS.md 内容源）

> 本文件是 lo 生态**工作区根目录** `AGENTS.md` 的版本化模板（lo-meta 托管）。
> 当工作区删除/重建时，克隆 lo-meta 后按本文件重建工作区根 `AGENTS.md` 即可。
> 内容与 lo-meta 总纲同源（§0 仓库速览 + 铁律速记 + §5.1 文档更新方法）。

---

# AGENTS.md — lo 生态工作区入口

本目录是 lo 生态（7 个 git 仓库）的工作区。**开始任何改动前，先读生态总纲**
（`docs/ecosystem/AGENTS.md`——**全仓库唯一权威总纲**：跨仓库边界、契约铁律、
不可触犯边界 §12、开发流程、测试、文档、审查、提交规范），再进入具体仓库。

> 生态总纲是环境无关文档：它只用仓库名，不依赖任何本地目录名或路径。
> 各仓库根目录 `AGENTS.md` 为**薄入口**（保留仓库身份/定位 + 指向总纲），不重复细节。

## 仓库速览

| 仓库 | 角色 |
|---|---|
| `lo`（工作区目录名 `log/`） | lo Core——世界模型 + 能力中心（CLI / `lo serve`，端口 8765） |
| `lo-client-sdk` | `@lo/client`——Core 协议客户端（所有外部消费者统一通道） |
| `lo-plugins-sdk` | `@lo/plugins-sdk`——Core 插件开发契约 |
| `lo-plugins` | Core 插件源码 + 分发仓库（epub-reader 等） |
| `lo-agent` | Electron 桌面客户端 + 客户端插件宿主 |
| `lo-agent-plugins-sdk` | `@lo/agent-plugins-sdk`——客户端插件开发契约 |
| `lo-agent-plugins` | 客户端插件源码 + 分发仓库（demo-hello 等） |

## 铁律速记

- 插件只经 `ctx.lo` / `ctx.extensions` / `ctx.resources` 等契约门面访问能力，**禁止裸 `repo`、`ctx.getRepository()`、插件内嵌 `@lo/client`、硬编码端口**。
- lo Core 是唯一世界模型持有者；外部访问一律经 `@lo/client`。
- 依赖单向：Plugin → 契约 → Host Adapter → `@lo/client` → lo Core。
- SDK 不依赖宿主、不封装 `@lo/client`、不定义二次协议。
- 插件权限默认只读，写操作需显式声明于 `manifest.permissions.lo`。
- mountEl 插件 UI 在 isolated world 执行，只持 `ctx`，不可触达 `window.loAgent.loCore`。

完整规范见 **`docs/ecosystem/AGENTS.md`**（§12 为不可触犯边界）。

## 文档更新方法

lo 生态文档统一聚合到 **lo-meta**（一个仓库看所有文档）。更新流程见总纲 **§5.1**：
改各仓库源 `docs/` → 在 lo-meta 跑 `node scripts/sync.cjs`（幂等重聚合）→ 提交 lo-meta；
lo-meta 的 `repos/<仓库>/` 是镜像，勿手改。

---

## 重建步骤（工作区删除后）

1. 克隆 7 个代码仓库 + `lo-meta`（GitHub 组织 `ouuabb`）；按速览表约定目录名（`lo` → `log/`）。
2. 复制本文件内容为工作区根 `AGENTS.md`（本文件即该内容的模板）。
3. opencode 全局 `instructions` 已指向 lo-meta 总纲；各仓库 `opencode.json` references 指向 `ouuabb/lo-meta`。
