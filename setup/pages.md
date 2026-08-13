# GitHub Pages（线上文档中心）

lo-meta 文档中心构建为 VitePress，通过 GitHub Actions 部署到 Pages。

## 一次性启用（需在 GitHub 网页操作）

1. 打开 `https://github.com/ouuabb/lo-meta` → **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
   （选了 Actions 后**不会**出现 root/docs 选择——那是 "Deploy from a branch" 才有的；
   部署目录由 workflow 产物决定）
3. 保存后，`main` 分支推送会触发 `.github/workflows/docs.yml`：
   `npm ci` → `npm run docs:build` → `upload-pages-artifact(dist)` → `deploy-pages`

## 访问

站点地址：`https://ouuabb.github.io/lo-meta/`

> 若样式丢失（无 CSS）：确认 `.vitepress/config.mjs` 的 `base` 为 `'/lo-meta/'`
> （GitHub Pages 项目站点子路径；本地 dev 访问 `http://localhost:5173/lo-meta/`）。

## 本地预览

```bash
cd <workspace>/docs
npm run docs:dev      # http://localhost:5173/lo-meta/
npm run docs:build    # 构建到 dist/
npm run docs:preview  # 预览（默认 http://localhost:4173）
```

## 常见问题

- **`Get Pages site failed`**（CI 的 configure-pages 步骤）：仓库 Pages 未启用或未选
  GitHub Actions → 按上面第 1 步设置。
- **端口冲突**：`docs:dev` 用 5173；若被其他 dev server（如 lo-agent）占用，先停掉对方
  或改用 `vitepress dev . --port <port>`。
