# AGENTS.md — lo 生态总纲（统一规范，全仓库共享）

本文件是 **lo 生态全部仓库的唯一权威总纲**。它**完全自包含、不依赖任何本地目录名、
绝对路径、外部文档或机器环境**——在任何一台机器上克隆这些仓库后，把本文件交给 AI，
即可按它工作。

- **来源**：本文件由原生态总纲 + 各仓库 `AGENTS.md` 全部内容合并去重而成，**不删任何一点**。
- **使用方式**：各仓库根目录的 `AGENTS.md` 为**薄入口**（保留仓库身份/定位 + 指向本文件）；
  局部文件优先，本总纲定义跨仓库边界、契约与协作规范。
- **契约以真实代码为准**：文档与代码冲突时，以代码为准并回报。
- **不可触犯边界**：本会话收敛的 7 类硬边界见 **§12**，改动前必读。

---

## 0. 生态地图：七个仓库

| 仓库 | 角色 | 运行位置 | 包名 | 说明 |
|---|---|---|---|---|
| **lo**（工作区目录名 `log/`） | lo Core——世界模型 + 能力中心 | 服务进程（CLI / `lo serve`） | bin `lo` | 唯一世界模型持有者；对外走 HTTP 协议 |
| **lo-client-sdk** | Core 协议客户端（所有外部消费者统一通道） | 任意外部进程 | `@lo/client` | 零依赖 HTTP 客户端 |
| **lo-plugins-sdk** | Core 插件开发 SDK（契约层） | lo Core 进程内 require | `@lo/plugins-sdk` | 定义 Core Plugin 与 Core 的契约 |
| **lo-plugins** | Core 插件源码 + 分发仓库 | 打包为 tar.gz 分发 | — | 非运行环境；运行在 Core 插件系统内 |
| **lo-agent** | Electron 桌面客户端 + 客户端插件宿主 | Electron（main/preload/renderer） | `lo-agent` | Core 的消费者之一 |
| **lo-agent-plugins-sdk** | 客户端插件开发 SDK（契约层） | lo-agent 内 | `@lo/agent-plugins-sdk` | 定义客户端插件如何写 |
| **lo-agent-plugins** | 客户端插件源码 + 分发仓库 | 打包为 tar.gz 分发 | — | 非运行环境；运行在 lo-agent 宿主内 |

**分层图（不可破坏）**：

```
                        lo Core（世界模型 / Resource / Relation / Operation / Workflow）
                                  ▲
                                  │ HTTP（lo serve，默认 127.0.0.1:8765）
                         lo-client-sdk（@lo/client）
                                  ▲
                ┌─────────────────┼──────────────────┐
                │                                     │
           lo-agent（桌面端）                    其他客户端（未来）
                │
        lo-agent-plugins-sdk（客户端插件契约）
                ▼
          Agent Plugin（扩展客户端交互）

lo Core 进程内：lo-plugins-sdk（插件契约） ──► Core Plugin（扩展世界模型能力）
lo-agent 进程内：lo-agent-plugins（源码+分发） ──► Agent Plugin
```

**关键定位区分（永不混淆）**：
- `@lo/client` = **通信能力层**（如何访问 Core）
- `@lo/agent-plugins-sdk` = **客户端扩展契约层**（如何扩展 lo-agent）
- 两者不合并、不互相包含（Agent SDK 内部使用 `@lo/client`，但职责不同）。

---

## 1. 契约铁律（Contract Rules）—— 违反即破坏

以下规则是生态的**不可破坏边界**，改动前逐条自查。

### 1.1 世界模型唯一性
- **lo Core 是唯一世界模型持有者**。Resource / Relation / Operation / Event / Workflow
  只由 Core 定义与落库。
- 任何其他仓库**不得**自行维护业务模型副本、绕过 Core 直接读写仓库数据。

### 1.2 访问路径唯一
- 外部消费者访问 Core 一律经 **`@lo/client`（HTTP 协议）**。
- **禁止**：直接 require lo Core 内部文件、绕过 SDK 裸拼 HTTP、插件内嵌 `@lo/client`。
- 插件访问 Core 只允许经 **`ctx.lo`**（契约门面），禁止触碰 `LoClient` 原始实例 /
  HTTP 传输层 / Core 内部对象。

### 1.3 插件三层契约（Core Plugin 收敛）
- lo Core 插件只经 `PluginContext` facade：`ctx.resources / ctx.relations / ctx.config /
  ctx.repoPath / ctx.logger`。
- **禁止**：`ctx.getRepository()`、裸 `repo`、`resourceService`/`relationService` 直连、
  硬编码端口（如阅读器端口须经配置下发，不写死）。
- 命令行插件命令 handler 签名：`async run(args, ctx)`，ctx 为 `PluginContext` facade。

### 1.4 SDK 边界
- **SDK 不依赖宿主**（无反向依赖）；**SDK 不封装 `@lo/client`**；**SDK 不定义二次协议**。
- SDK 只定义契约（方法白名单 + noop 默认），实现由宿主注入。
- 新公开 API（基类方法 / 上下文门面 / 事件约定）必须同步 `types/index.d.ts`、README、测试。

### 1.5 依赖方向（单向）
```
Plugin → ctx.lo（契约）→ Host Adapter（实现）→ @lo/client → lo Core
Plugin → ctx.extensions（契约）→ Host ExtensionRegistry（实现）→ 命令执行 Runtime
```
- 插件只从自己的 SDK `require`，永不 `require` 宿主内部文件。
- lo-agent 插件经 `ctx.lo` / `ctx.extensions` 访问能力；renderer 不接触 Node/网络，
  一律经 preload 白名单 IPC。

### 1.5b IPC 白名单铁律（lo-agent）
- **渲染进程 → 主进程只能经 preload 白名单通道**（`window.loAgent.*` →
  `ipcRenderer.invoke(白名单通道)`），通道逐一绑定主进程具体方法。
- **禁止**：向渲染进程透传任意调用、任意处理函数、`PluginManager`/`@lo/client` 原始实例。
- **插件能力接入 UI 时**：新增 `agent-plugins:*` 白名单通道（如
  `agent-plugins:execute-command`），绑定到 `PluginManager.executeCommand` 等具体方法，
  preload 只暴露固定方法签名——与既有 `lo-core:*` 完全同构，不透传。
- 主进程持有能力宿主（`LoCoreService` / `PluginManager`），渲染层永远只经白名单调用。
- **插件 UI（mountEl）**：插件 `manifest.ui` 模块在渲染进程 **isolated world** 执行，
  **不可访问** `window.loAgent.loCore` / App 内部对象；只持 `ctx`。能力经
  `agent-plugins:ctx`（代理到主进程插件 `context.lo` facade 裁决）与
  `agent-plugins:get-ui-module`（读 ui 源码）两个通道提供；worldId 由 Host 统一分配。

### 1.6 权限模型（最小权限）
- 插件默认**只读**；写操作（`operations.write` / `relations.write` 等）必须显式声明于
  `manifest.permissions.lo`。
- `ctx.lo` 门面按白名单过滤，未授权方法调用抛错。
- 权限在激活期由宿主经 `resolvePermissions(manifest.permissions)` 解析。

---

## 2. 各仓库技术栈与命令速查（含各仓库 AGENTS.md 细节，已合并去重）

### 2.1 通用约束（全部仓库）
- **JavaScript CommonJS（`.cjs`）**；无 TS 源码（仅 `types/index.d.ts` 声明）。
- Node >= 20；双空格缩进、单引号、分号、100 列上限（由各库 `.prettierrc`/`.eslintrc` 约束）。
- **不要修改** `node_modules/`、`dist/`、`out/`、`coverage/` 等生成目录。
- 提交信息遵循 **Conventional Commits**：type 英文小写
  （feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert）+ subject 中文；
  **header ≤ 72 字符**（commitlint 强制）。
- husky：`pre-commit` 跑全量测试，`commit-msg` 校验提交信息。

### 2.2 lo（lo Core，工作区目录名 `log/`）
- 命令：`npm start` / `npm test` / `npm run lint` / `npm run format` / `npm run docs:build`。
- 测试：Jest + `--forceExit`；273+ 测试文件、3646+ 用例；覆盖率默认开启；新增功能必配测试。
- 依赖：chalk / chokidar / fs-extra / fuse.js / glob / inquirer / nanoid / sqlite3 / tar / uuid / yargs。
- **关键目录（仓库内相对路径）**：
  - `src/cli.cjs`：yargs CLI 入口 + 插件扩展命令分发
  - `src/repo/`：repository 与世界模型核心（SQLite）
  - `src/plugin/`：Core 插件系统 + `PluginContext` facade（`pluginContext.cjs` /
    `pluginManager.cjs` / `extensionRegistry.cjs` / `extensionCommand.cjs` / `pluginHttp.cjs`）
  - `src/operations/`：OperationEngine + 操作注册（30+ 类型）
  - `src/event/`：EventBus / EventStore / EventRegistry
  - `src/workflow/`、`src/automation/`、`src/agent/`、`src/collaboration/`、`src/security/`
  - `src/commands/serve.cjs`：HTTP 服务（默认端口 8765，路由 100+）
  - `src/core/` `src/domain/` `src/ai/` `src/evolution/` `src/runtime/` `src/config/` `src/utils/`
- **契约要点（Core 内部）**：
  - 插件命令分发两条路径都注入 `PluginContext` facade，不注入裸 Repository；
    自动化 `plugin.invoke` 同样构造 facade（`automation/action/plugin.cjs`），不泄漏 `ctx.repo`。
  - `PluginContext` 提供 SDK 风格 getter（`resources/relations/config/repoPath/logger/hooks/events`）；
    旧版 `getRepository()` 仅向后兼容，**新代码禁用**。
  - Relation facade：`getByFromRidAndType/update/listFrom/listTo`；
    Resource facade：`create/getByRid/list/update/delete`。
  - 写操作一律经 `operationEngine`（Operation 语义），事件由 Operation 统一 emit。
- **变更前必读**：改协议/边界先读生态规格文档（编号见 §10 与 `specs/`，如 002 能力协议、
  006 边界、010 协议收敛）；改插件系统读 `src/plugin/` 文件头注释 + 规格 008、013；改 Agent 读
  `src/agent/`；改 `serve.cjs` 路由参照现有 `route()` 写法与 `matchRoute` 正则。
- 提交：不提交 `node_modules/`、`coverage/`、`.repo/`、secrets。

### 2.3 lo-client-sdk（@lo/client）
- 命令：`npm test` / `npm run lint` / `npm run format`。
- 纯 CJS、**零运行时依赖**（dependencies/peerDependencies 为空）；devDeps：jest/eslint/prettier/husky/commitlint。
- **架构**：`src/index.cjs`（统一出口：LoClient/AuthClient/LoApiError/LoHttpError/SDK_VERSION）、
  `src/client.cjs`（request 管线：URL 拼接/query/错误转换/token 注入 + 各资源命名空间）、
  `src/http.cjs`（底层请求：超时/重定向/JSON 解析/LoApiError/LoHttpError）、
  `src/auth.cjs`（signWithSshKeygen + AuthClient，SSH 挑战-应答）。
- 命名空间：notes / search / schemas / views / workflows / automations / evolution /
  admin / relations / operations / events / health。
- **关键约定**：所有 API 返回 `res.body`（业务数据）不抛业务异常；错误统一转
  `LoApiError`（status/code/body）或 `LoHttpError`（请求失败/超时/重定向超限）；
  `transport` 可注入（`(ctx) => Promise<{status, body, headers}>`）供测试免真实网络；
  登录后 token 自动 `Authorization: Bearer`，admin token（`setAdminToken`）优先；
  **不要加第三方依赖**，新 HTTP 特性直接在 `http.cjs` 实现。
- **变更前必读**：`/api/auth/*` 端点避免携带 token（内部 `skipAuth`）；新增资源在
  `client.cjs` 建命名空间（参考 notes）+ 补 `types/index.d.ts` + `test/client.test.cjs`。

### 2.4 lo-plugins-sdk（@lo/plugins-sdk）
- 命令：`npm test` / `npm run docs:build`（vitepress）。
- 纯 CJS、零运行时依赖；**不 require `@lo/client`**；devDeps：jest/eslint/prettier/husky/commitlint/vitepress。
- 契约：`Plugin` 基类、`PluginContext`、`ResourceBuilder` / `RelationBuilder`、`EventApi`、`Logger`；
  结构：`src/Plugin.cjs` `src/PluginContext.cjs` `src/ResourceBuilder.cjs`
  `src/RelationBuilder.cjs` `src/EventApi.cjs` `src/Logger.cjs` `src/index.cjs` `src/base/` `src/builders/`。
- 契约铁律：SDK 只定义契约，真实 `PluginContext` 由 Core PluginManager 加载时注入；
  **不依赖 lo Core 内部实现**、不 require lo-agent、不封装 `@lo/client`、不定义二次协议；
  插件只从 `@lo/plugins-sdk` require；新公开 API 同步 `types/index.d.ts`/README/测试。

### 2.5 lo-plugins（Core 插件仓库）
- 命令：`yarn test` / `npm test`（Jest，209+ 用例）/ `yarn run build`（打包分发）/ `yarn run docs:build`。
- 包：`packages/epub-reader`（EPUB 阅读：commands + HTTP 阅读器 + 笔记/标注）、
  `packages/epub-library`（书库展示）、`packages/chrome-translate`（Chrome 划词翻译）。
- **契约铁律（插件收敛）**：epub-reader 是 facade 收敛基准，其他插件照此——插件代码**只经
  SDK facade**（`ctx.resources/ctx.relations/ctx.config/ctx.repoPath/ctx.logger`）；禁止
  `ctx.getRepository()`、裸 `repo`、`resourceService`/`relationService` 直连、内嵌 `@lo/client`、
  硬编码端口（reader 8765 须经 `ctx.config('readerBaseUrl')` 下发）；CLI handler 签名
  `async run(args, ctx)`；文件路径用 `path.join(__dirname, ...)`/`os.tmpdir()`，**禁止硬编码盘符**
  （Linux CI 会失败）。
- 测试：单测在 `packages/<id>/test/`；Mock 用 SDK facade 形状，不 mock 裸 repo。
- CI：ubuntu + windows × Node 20/22；需检出同级 `lo-plugins-sdk`。

### 2.6 lo-agent（Electron 桌面端）
- 命令：`npm run dev`（Vite 5173 + Electron HMR）/ `npm run build`（Vite 构建到 `dist/`）/
  `npm start`（构建后启动）/ `npm test` / `npm run lint` / `npm run format`。
- 测试：Jest + `--experimental-vm-modules`（**不要裸跑 `npx jest`**，否则依赖 ESM 的测试会失败）。
- 结构：`src/main`（含 `plugin/` 宿主）、`src/preload`、`src/renderer`。
- **主进程 ↔ 核心**：`src/main/lo-core.cjs`（`LoCoreService` 封装 `@lo/client`，方法返回
  `{ ok, ... }` 或 `{ ok:false, error, message }`）、`src/main/ipc.cjs`（白名单 `lo-core:*`）、
  `src/main/config-store.cjs`（`userData/lo-agent.json`）、preload `window.loAgent.loCore`。
- 插件宿主：`PluginManager` / `PluginLoader` / `LoAdapter` / `ExtensionRegistry`；
  `PluginManager.executeCommand(id, args)` 执行命令。
- **插件服务（插件间通信）**：`ctx.extensions.registerService([{ id, title?, version?, api }])`
  注册服务；其他插件经 `ctx.extensions.getService(id)` / `listServices()` 消费；提供者停用/
  禁用时服务从注册表清理，消费者判空降级（`getService` 同步语义，提供者须已激活）。
- **依赖与激活顺序**：`manifest.dependsOn` 声明依赖插件 ID；`activateAll` 按依赖拓扑排序
  （提供者先激活），`dependsOn` 硬依赖强制先激活被依赖方（即使对方声明延迟激活）。
- **延迟激活**：`manifest.activationEvents` 仅含 `onCommand/onView/onPanel/onEditor:<id>`
  触发点的插件启动不激活，宿主在首次执行/渲染对应能力时懒激活后重试；`onStartup`/`*` 或
  未声明 → 启动激活。
- **插件 UI（mountEl）**：`manifest.ui` ESM 模块在渲染进程 **isolated world** 执行，
  `render(mountEl, ctx)` 挂载真实 DOM；worldId 由 `PluginManager.getUiWorldId` 分配；
  ctx 能力经 `agent-plugins:ctx` 代理到插件既有 `context.lo`（Phase B facade 裁决）；
  ui 源码经 `agent-plugins:get-ui-module` 读取；preload `pluginUi` 桥用
  `webFrame.executeJavaScriptInIsolatedWorld` + `contextBridge.exposeInIsolatedWorld`。
- **技术栈**：React 19 + Vite；Electron 主进程 `src/main`/preload `src/preload`/渲染 `src/renderer`。
- **安全基线**：`contextIsolation:true`、`nodeIntegration:false`、`sandbox:true`；
  renderer 只经 `window.loAgent`（preload 白名单）；渲染进程不接触 Node API。
- **开发说明**：开发模式经 `ELECTRON_RENDERER_URL` 加载 Vite dev server；生产加载 `dist/index.html`；
  新增渲染 UI 放 `src/renderer/src/`（函数式 + Hooks）。
- 注意：`node_modules/@lo/agent-plugins-sdk` 是 `file:` 依赖的拷贝，改 SDK 后需重新安装同步（见 §4.2）。
- 提交：不提交 `node_modules/`、`dist/`、`out/`。

### 2.7 lo-agent-plugins-sdk（@lo/agent-plugins-sdk）
- 命令：`npm test` / `npm run lint` / `npm run format` / `npm run docs:build`（占位校验）。
- 纯 CJS、**无强制运行时依赖**；`@lo/client` 是可选 `peerDependencies`（宿主注入）；
  未注入时 `ctx.lo` 返回 noop（调用抛错提示）。devDeps：jest/eslint/prettier/husky/commitlint/babel。
- **架构**：`src/index.cjs`（统一出口）、`src/AgentPlugin.cjs`（基类）、
  `src/AgentPluginContext.cjs`（运行时上下文）、`src/lo-facade.cjs`（ctx.lo 契约，Host 注入）、
  `src/extensions-facade.cjs`（ctx.extensions 契约）、`src/manifest.cjs`（manifest schema + 校验，
  导出 `manifestSchema`）、`src/lifecycle.cjs`（状态枚举 + 转移表）、`src/types.cjs`（capability/
  permission）、`src/AgentEventEmitter.cjs`、`src/Logger.cjs`、`src/validateManifest.cjs`、
  `src/loadPlugin.cjs`；`docs/manifest-spec.md`（Manifest 独立规范，与 manifestSchema 同源）。
- 契约：`AgentPlugin` 基类、`AgentPluginContext`（`ctx.lo`/`ctx.extensions`/`ctx.config`/
  `ctx.events`/`ctx.settings`）、`createLoFacade`/`LO_PERMISSION_MAP`、`createExtensionsFacade`、
  `validateManifest`、`createPlugin`、`AgentEventEmitter`、`Logger`。
- **依赖方向**：`Plugin → ctx.lo(契约) → Host Adapter(实现) → @lo/client → lo Core`；
  `Plugin → ctx.extensions(契约) → Host ExtensionRegistry(实现) → 命令执行 Runtime`。
- **关键约定**：插件只从 `@lo/agent-plugins-sdk` require；所有能力接口有 noop 默认（未注入不崩溃）；
  `ctx.lo` 只定义命名空间与方法签名（operations/relations/events/resources/health）；
  `ctx.extensions` 只定义方法白名单（registerCommands/registerView/registerPanel/registerEditor/
  registerService/getService/listServices）；事件点号命名（`resource.created`，自定义 `<pluginId>.<event>`）；
  生命周期/能力权限由 SDK 定义、Host 按契约驱动；新 API 同步 types + 测试。
- **变更前必读**：修改公开契约（基类/上下文门面/事件约定）直接影响宿主与已发布插件，需谨慎并
  同步 README/AGENTS/types；新增能力在对应模块实现 + 导出 `src/index.cjs` + 补类型 + 补测试。

### 2.8 lo-agent-plugins（客户端插件仓库）
- 命令：`yarn run build`（打包 tar.gz + index.json，含 sha256）/ `npm run docs`（生成插件目录）/
  `npm run docs:check`（文档系统一致性校验）。devDeps：fs-extra / tar / husky。
- 插件：`packages/demo-hello`（最小示例：命令 + 视图 + 面板 + 编辑器 + **服务提供者** +
  mountEl UI + 经 `ctx.lo` 访问 Core）、`packages/demo-consumer`（服务消费方 + `dependsOn`）。
- **契约铁律（插件收敛）**：插件只 `require('@lo/agent-plugins-sdk')`，永不 require lo-agent
  内部文件；访问 Core 只经 `ctx.lo`（权限白名单过滤）；注册能力经 `ctx.extensions`；
  权限默认只读，写操作声明于 `manifest.permissions.lo`；manifest 必填 `id/name/version/main`，
  id kebab-case。
- **文档系统**：`docs/plugins/index.md` 由 `scripts/docs-gen.cjs` 从 manifest 自动生成（勿手改）；
  `docs-check` 校验机器事实（manifest 格式/id 唯一/生成幂等/orphan/引用路径/dist 一致），
  不校验语义；不强制每插件有 prose 文档；整体基线 `docs/.baseline`。
- 提交：不提交 `dist/`、`node_modules/`、`coverage/`。

---

## 3. 开发流程（AI 必须遵守）

### 3.1 动手前
1. **定位仓库**：改动涉及哪个/哪些仓库？先读该仓库 `AGENTS.md`（薄入口 → 本总纲）。
2. **摸清现状**：搜代码确认现状，不做无依据假设；契约以真实代码为准。

### 3.2 修改中
1. **遵守单一职责**：只改目标文件，不顺手重构无关代码。
2. **遵守边界**：见 §1 契约铁律与 §12 不可触犯边界。
3. **测试同步**：改逻辑必补/改测试；新公开 API 必补用例。
4. **文档同步**：改公开契约/行为 → 更新 `types/index.d.ts`、README、相关 AGENTS.md。

### 3.3 提交前（自查清单）
- [ ] `npm test` 全绿（对应仓库）
- [ ] `npm run lint` 无 error（warning 也应尽量清零）
- [ ] 提交信息 ≤72 字符、Conventional Commits
- [ ] 未误提交 `node_modules/`、`dist/`、`coverage/`、锁文件（除非有意变更）
- [ ] 未提交 secrets（私钥、token）
- [ ] 未跨仓库混提（一个仓库一个 commit；多仓库联动各自提交）

### 3.4 提交后
- 确认 CI 通过（若该仓库配了 GitHub Actions）。
- 多仓库联动（如 SDK 改契约 + 宿主消费）时：**先推 SDK，再推宿主**；宿主 CI 的
  `file:` 依赖从远程检出，必须保证远端 SDK 已含新 API。

---

## 4. 测试全覆盖要求

### 4.1 什么必须测
- 新公开 API（SDK 方法/门面）→ 单测。
- 权限/边界逻辑（授权放行、未授权拒绝）→ 单测。
- 命令执行、扩展点注册/清理 → 单测。
- 跨平台路径（Windows `C:\` vs POSIX）→ 用 `__dirname`/`os.tmpdir()` 而非硬编码盘符；
  CI 覆盖 ubuntu + windows。

### 4.2 已知陷阱
- **lo-agent 必须用 `npm test`**（含 `--experimental-vm-modules`），裸 `npx jest`
  会让依赖 ESM 的测试失败。
- **lo-agent 的 `node_modules/@lo/agent-plugins-sdk` 是文件拷贝**：改 SDK 后需在
  lo-agent 里重新安装同步，否则宿主测试拿到旧契约。
- Windows PowerShell 下 `&&` 不可用，用 `cmd1; if ($?) { cmd2 }`。

---

## 5. 文档即时更新

以下变更**必须**同步文档，否则视为未完成：
- 新增/修改公开 API → `types/index.d.ts` + README（对应 SDK/仓库）。
- 修改公开契约（基类/上下文门面/事件约定/权限）→ README + AGENTS.md。
- 新增仓库或改变仓库职责 → 本总纲 §0。
- 注释过期（如"执行由后续 Runtime 管理"这类已实现）→ 立即修正，避免误导。

### 5.1 文档聚合（lo-meta）——文档更新方法

lo 生态文档由 **lo-meta** 仓库统一聚合（**一个仓库看所有文档**）：
- `ecosystem/AGENTS.md`——本总纲（唯一权威，含 §12 不可触犯边界）
- `specs/`——生态规格文档（001–013）
- `repos/<仓库>/`——各仓库 `docs/` 的**镜像**

**文档更新流程（必须遵守）**：
1. **各仓库 `docs/` 是文档事实源**；lo-meta 的 `repos/<仓库>/` 是镜像，**勿手改**。
2. 改文档：先改**对应仓库源 `docs/`**（本总纲与规格直接在 lo-meta 内改）。
3. 重聚合：在 lo-meta 跑 `node scripts/sync.cjs`（幂等，把各仓库 `docs/` 镜像到 `repos/<仓库>/`）。
4. 提交：仓库源文档提交到对应仓库；总纲/规格/镜像提交到 lo-meta。
5. 新增聚合仓库：在 lo-meta `scripts/sync.cjs` 的 `REPOS` 数组追加 `{ dir, name }` 后跑 sync。

> 各仓库根 `AGENTS.md` 为薄入口，指向本总纲；opencode 全局 `instructions` 自动加载总纲，
> 各仓库 `opencode.json` 的 `references` 指向 `ouuabb/lo-meta`。

### 5.2 文档系统设计原则（如实反映代码）

生态文档系统遵循 5 条原则（lo-agent-plugins 为参考实现），确保文档**如实反映代码**：

1. **来源导向**：每个结论可回溯到 `file:line` + 契约文档链接；文档头部标注
   「核对基线 commit/日期」。
2. **生成式目录**：插件目录/扩展点清单由 `packages/*/plugin.json` 生成（`docs-gen`），
   杜绝手写漂移；人工只写 prose。
3. **一致性校验**：`docs-check` 脚本校验「packages ↔ 文档目录」「manifest ↔ 生成表」
   「dist ↔ packages」「文档引用路径存在」；接入 CI。
4. **分层不重复**：README 只做入口；不重复生态总纲 / SDK `manifest-spec.md`，只引用。
5. **进度如实**：功能矩阵明确 **已实现/部分/未实现** + 代码位置 + 验证方式；未实现清单
   （marketplace、单测、CI 等）显式写出。

> 实现位置：`lo-agent-plugins/scripts/docs-gen.cjs`、`docs-check.cjs`、`docs/`；
> 机器事实层与人工解释层分离，`docs-check` 只校验机器可确定事实、不校验语义。

---

## 6. 写完审查代码（Self-Review Checklist）

提交前逐项审查：
- [ ] **边界**：是否出现裸 `repo`、`ctx.getRepository()`、`@lo/client` 进插件、绕过 facade？
- [ ] **权限**：新写操作是否要求插件显式声明权限？默认只读是否保持？
- [ ] **单向依赖**：SDK 是否 require 了宿主？插件是否 require 了宿主内部？
- [ ] **noop 契约**：SDK 新门面是否都有未注入时的安全默认（抛错提示而非崩溃）？
- [ ] **错误处理**：异步是否有 catch？错误信息是否含足够上下文（插件 ID、方法名）？
- [ ] **安全**：无 secrets、无任意 IPC 透传、renderer 不接触 Node。
- [ ] **性能**：无泄漏（定时器/订阅清理）、无重复解析（如阅读器缓存）。
- [ ] **可测性**：是否补了测试？测试是否覆盖了拒绝/边界路径？

---

## 7. 常见陷阱速查

| 陷阱 | 后果 | 规避 |
|---|---|---|
| 插件内 `ctx.getRepository()` 或裸 `repo` | 破坏 facade 收敛 | 用 `ctx.resources/ctx.relations/ctx.config/ctx.repoPath` |
| 插件硬编码端口 | 配置不可下发 | 经 `ctx.config(...)` 下发 |
| SDK require 宿主 / 插件 require 宿主内部 | 反向依赖 | SDK 只定义契约，宿主注入实现 |
| `ctx.lo` 全量透传不校验权限 | 越权 | 用 `resolvePermissions` + `LO_PERMISSION_MAP` |
| lo-agent 裸跑 `npx jest` | ESM 测试失败 | 用 `npm test` |
| 改 SDK 后 lo-agent 未重新安装 | 宿主用旧契约 | 同步依赖 |
| 提交信息 >72 字符 | commitlint 拒绝 | 精简 subject |
| 跨仓库同一次改动混在一个 commit | 破坏提交边界 | 一仓库一 commit |
| 只改代码不更 README/types | 契约文档失真 | 见 §5 |
| 硬编码盘符路径 | Linux CI 失败 | 用 `__dirname`/`os.tmpdir()` |

---

## 8. 边界速查表（改动前对照）

| 边界 | 允许 | 禁止 |
|---|---|---|
| 插件 → Core | 经 `ctx.lo`（契约门面） | 直接 require `@lo/client` / 直接 HTTP / `ctx.getRepository()` |
| 插件 → lo-agent | 经 `ctx.extensions` / `ctx.events` / `ctx.config` / `ctx.settings` | require lo-agent 内部文件 |
| 插件 ↔ 插件 | 经事件总线 / 共享 service | 直接 require 彼此文件 |
| 插件 → 文件系统 | 仅自己插件目录 + `permissions.storage` | 任意路径访问 |
| 外部消费者 → Core | 经 `@lo/client` | 拼裸 HTTP / 直接读仓库数据 |
| Core Plugin | 扩展世界模型能力 | 不经 PluginContext facade |
| Agent Plugin | 扩展客户端交互能力 | 触碰 LoClient / HTTP 传输 / Core 内部对象 |
| lo-agent renderer → main | 经 preload 白名单通道（`lo-core:*` / `agent-plugins:*`） | 透传任意调用/处理函数/宿主实例 / 接触 Node·网络 API |
| main → 插件能力（UI 入口） | 经 `agent-plugins:*` 白名单通道绑定具体方法 | 把 `PluginManager`/`@lo/client` 实例交给 renderer |
| 插件 UI 能力 | 经 `agent-plugins:ctx`（代理到 `context.lo` facade） | 直连 `lo-core:*` / 访问 `window.loAgent.loCore` |

---

## 9. 版本节奏（不提前设计）

当前是**契约建立期**：Core 能力稳定 > client-sdk 协议稳定 > lo-agent 基础客户端完善 >
Core Plugin 生态完善 > Agent Plugin Runtime（按实际需求设计）。
- **不提前设计**：Agent Runtime、Agent Plugin Runtime、Sandbox、内置模块插件化、
  Agent 多进程。
- 涉及上述领域的改动需先确认不在冻结范围，再动。

---

## 10. 协议概念速查（本总纲内联，无需外部文档）

以下是生态通用的核心概念。它们与代码一一对应，AI 改动时可据此定位代码：

| 概念 | 含义 | 对应代码位 |
|---|---|---|
| Operation 语义 | 状态变化的可追踪事实：`type + params + context(actor)`，可记录/撤销 | lo Core `src/operations/`；`@lo/client` `operations` 命名空间 |
| Event 语义 | 领域事实广播（如 `resource.created`），点号命名 | lo Core `src/event/`；`@lo/client` `events`（SSE） |
| Resource / Relation | 世界模型基本实体；插件读写只经 facade | `PluginContext` / `ctx.lo` 的 `resources`/`relations` |
| PluginContext facade | Core 插件的受限能力面 | lo Core `src/plugin/pluginContext.cjs` |
| ctx.lo 门面 | 客户端插件经 `@lo/client` 访问 Core 的白名单契约 | lo-agent `src/main/plugin/lo-adapter.cjs`；`ctx.lo` |
| 最小权限 | 插件默认只读，写需声明 | `manifest.permissions.lo`；`resolvePermissions`；`LO_PERMISSION_MAP` |
| 单向依赖 | 插件 → 契约 → 宿主 → `@lo/client` → Core | 见 §1.5 |
| mountEl UI | 插件渲染端 UI，isolated world 挂载真实 DOM | `manifest.ui`；`agent-plugins:ctx`；preload `pluginUi` |

> 若发现某概念与真实代码不符，以代码为准，并回报差异。

---

## 11. 快速开始（AI 首次进入）

1. 读本文（已完成）。
2. 进入目标仓库，读该仓库 `AGENTS.md`（薄入口，指向本文）。
3. 搜代码确认现状 → 按 §3 流程实施 → §4/§5 补测试与文档 → §6 自查 → §7 避坑 → 提交。

---

## 12. 不可触犯边界（本会话收敛，7 类）

以下 7 类边界是本项目工作过程中**逐条实证/收敛**的硬约束，改动前必须对照。

### 12.1 生态契约铁律（速记）
- 插件只经 `ctx.lo` / `ctx.extensions` / `ctx.resources` 等契约门面访问能力；
  **禁止裸 `repo`、`ctx.getRepository()`、插件内嵌 `@lo/client`、硬编码端口**。
- lo Core 是唯一世界模型持有者；外部访问一律经 `@lo/client`。
- 依赖单向：Plugin → 契约 → Host Adapter → `@lo/client` → lo Core。
- SDK 不依赖宿主、不封装 `@lo/client`、不定义二次协议。
- 插件权限默认只读，写操作需显式声明于 `manifest.permissions.lo`。

### 12.2 IPC 白名单铁律
- renderer→main 只能经 preload 白名单通道；**禁止**透传任意调用/处理函数/
  `PluginManager`/`@lo/client` 实例。
- 新插件能力只新增 `agent-plugins:*` **具体方法**通道，不建 `runtime:*` 协议套件。

### 12.3 mountEl / G2 安全模型（Spike 实证后收敛，最高优先）
- **G2 而非 G1**：要求插件 UI **技术上不可触达** `window.loAgent.loCore`；把「同 world
  信任边界文档化」当解决方案是**把约束降级**，已被否决。
- **无 iframe / WebView / lo-plugin:// 协议 / postMessage**；插件 UI 在渲染进程
  **isolated world**（worldId 由 Host 分配，插件不得自定）。
- **ctx 是插件 UI 唯一能力入口**；`ctx.lo → agent-plugins:ctx → 主进程
  PluginContext.lo（Phase B facade 裁决）→ @lo/client → lo Core`。
- **G2 只保证 JS 执行上下文隔离，不保证 DOM 内容隔离**；插件 UI 拒绝远程 `import()`。
- **dispose 在 world 内执行**（`executeJavaScriptInIsolatedWorld`），主 world 不持
  跨 world 函数引用；Blob URL 在 import 完成后 revoke。
- **不修改 `@lo/client`**；不重新设计权限/能力映射体系。
- Spike 实证事实：Blob ESM + `sandbox:true` + CSP `script-src blob:` 可行；
  contextBridge 暴露对象**深冻结不可移除**（loCore 无法从页面全局删除）。

### 12.4 生命周期收敛决定
- `dependsOn` 依赖拓扑激活（提供者先于消费者）；**硬依赖强制先激活被依赖方**（即使对方
  声明延迟激活）；循环依赖稳定兜底 + warn。
- `activationEvents`：仅 `onCommand/onView/onPanel/onEditor:<id>` 触发懒激活；
  `onStartup`/`*` 或未声明 → 启动激活；非法触发点（如 `onService:<id>`）校验报错。
- 服务 `getService` 为**同步**语义，提供者须已激活；消费方必须判空降级。
- 插件生命周期状态机（installed→loaded→activated→enabled→disabled→deactivated→disposed）
  由 SDK 定义、宿主按契约驱动。

### 12.5 流程纪律
- 提交顺序：**先 SDK，再宿主**（生态 §3.4）。
- **实现中碰到必须改架构边界时，先停下做审计，不自行扩大范围**。
- Conventional Commits（type 英文小写 + subject 中文，header ≤ 72）。
- 不提交生成目录（`dist/`/`node_modules/`/`coverage/`）与 secrets；版本 semver；
  插件 id kebab-case 且与目录名一致。

### 12.6 文档系统收敛
- 文档系统设计遵循 5 条原则（来源导向/生成式目录/一致性校验/分层不重复/进度如实）——见 **§5.2**。
- 机器事实层由 manifest 生成（`docs-gen`），`docs/plugins/index.md` **勿手改**。
- `docs-check` 只校验机器可确定事实（格式/id 唯一/生成幂等/orphan/引用路径/dist 一致），
  **不校验语义**；不强制每插件有 prose 文档。
- 整体基线 `docs/.baseline`（commit + 日期）而非逐篇维护。
- 文档统一聚合到 **lo-meta**（总纲 + 规格 + 各仓库 `docs/` 镜像）；更新方法见 **§5.1**，
  `repos/<仓库>/` 为镜像勿手改。

### 12.7 纠偏记录
- **服务消费权限守卫不是 spec 要求**（早期误列已收回）；service 相关仅「提供者须激活 +
  消费判空降级」。
- 文档与代码冲突时以代码为准并回报，不自行改契约。

---

> 若发现本总纲某条与真实代码不符，以代码为准，并回报差异以便修正本总纲。
