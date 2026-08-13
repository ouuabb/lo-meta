/**
 * sync.cjs —— 聚合各 lo 仓库 docs/ → lo-meta/repos/<name>/
 *
 * 用途：lo-meta 作为生态文档聚合仓库，一个仓库看所有文档。
 * 各仓库文档仍是「代码旁的事实源」，本脚本做幂等镜像：
 *   - 读取工作区下各仓库的 docs/ 目录
 *   - 整体复制到本仓库 repos/<name>/（先清空目标，保证与源一致）
 *
 * 边界：
 *   - 只读源仓库（不改动各仓库内容）
 *   - 目标 repos/<name>/ 为纯镜像，勿手改（改动请回源仓库）
 *
 * 用法：node scripts/sync.cjs
 */
const fs = require('fs');
const path = require('path');

// 工作区根（lo/）：本脚本位于 <workspace>/docs/scripts/
const WORKSPACE = path.resolve(__dirname, '..', '..');
const REPOS = [
  { dir: 'lo-agent-plugins', name: 'lo-agent-plugins' },
  // 未来聚合：{ dir: 'lo-agent', name: 'lo-agent' }, { dir: 'lo-client-sdk', name: 'lo-client-sdk' }, ...
];
const OUT_DIR = path.resolve(__dirname, '..', 'repos');

function copyDir(src, dst) {
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(src, dst, { recursive: true });
}

let ok = true;
for (const repo of REPOS) {
  const src = path.join(WORKSPACE, repo.dir, 'docs');
  if (!fs.existsSync(src)) {
    console.warn(`✗ 跳过 ${repo.name}：${repo.dir}/docs 不存在`);
    ok = false;
    continue;
  }
  copyDir(src, path.join(OUT_DIR, repo.name));
  console.log(`✓ 聚合 ${repo.name} → repos/${repo.name}`);
}
if (!ok) process.exitCode = 1;
