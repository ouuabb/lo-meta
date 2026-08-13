/**
 * lo-meta 文档中心 VitePress 配置
 *
 * 约定：
 *   - srcDir 为仓库根（.）——lo-meta 内容本身就是文档
 *   - 侧边栏/导航由 scripts（fs）从实际目录自动生成，避免手工漂移
 *   - 构建产物到 dist/（gitignore）
 */
import { defineConfig } from 'vitepress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 递归生成 sidebar 树（跳过 dotfile，只收 .md） */
function tree(relDir) {
  const dir = path.join(contentRoot, relDir);
  if (!fs.existsSync(dir)) return [];
  const items = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = path.join(dir, name);
    const rel = `${relDir}/${name}`;
    if (fs.statSync(full).isDirectory()) {
      items.push({ text: name, collapsed: true, items: tree(rel) });
    } else if (name.endsWith('.md') && name !== 'README.md') {
      items.push({
        text: name.replace(/\.md$/, ''),
        link: `/${rel.replace(/\\/g, '/').replace(/\.md$/, '')}`,
      });
    }
  }
  return items;
}

export default defineConfig({
  lang: 'zh-CN',
  title: 'lo-meta · lo 生态文档中心',
  description: 'lo 生态权威文档聚合仓库：总纲 + 规格 + 各仓库文档',
  // GitHub Pages 项目站点部署在 /lo-meta/ 子路径
  base: '/lo-meta/',
  srcDir: '.',
  srcExclude: ['**/scripts/**', 'README.md'],
  outDir: 'dist',
  cleanOutDir: true,
  lastUpdated: true,
  // .baseline（仓库基线文件）、.cjs（脚本）、.jsonc（配置文件）非站点页面，忽略其链接；.md 死链仍检查
  ignoreDeadLinks: [/\.baseline$/, /\.cjs$/, /\.jsonc$/],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '生态总纲', link: '/ecosystem/AGENTS' },
      { text: '规格', link: '/specs/001-execution-context-protocol' },
      { text: 'lo-agent', link: '/repos/lo-agent/index' },
      { text: 'lo-agent-plugins', link: '/repos/lo-agent-plugins/index' },
      { text: '复现指南', link: '/setup/README' },
    ],
    sidebar: {
      '/ecosystem/': tree('ecosystem'),
      '/specs/': tree('specs'),
      '/repos/lo-agent/': tree('repos/lo-agent'),
      '/repos/lo-agent-plugins/': tree('repos/lo-agent-plugins'),
      '/setup/': tree('setup'),
    },
    outline: { level: [2, 3], label: '本页' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    lastUpdated: { text: '更新于', formatOptions: { dateStyle: 'short', timeStyle: 'short' } },
  },
});
