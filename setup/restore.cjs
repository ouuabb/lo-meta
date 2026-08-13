/**
 * restore.cjs —— 恢复本机机器级配置（不在 git 内的项）
 *
 * 从 configs/ 恢复：
 *   1. 工作区根 AGENTS.md（configs/workspace-AGENTS.md → <workspace>/AGENTS.md）
 *   2. opencode 全局配置（写入 ~/.config/opencode/opencode.jsonc，
 *      instructions 按脚本位置自动推导到本仓库总纲，不依赖硬编码路径）
 *
 * 用法：node setup/restore.cjs
 * 幂等：可重复执行。
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

// <workspace>/docs/setup/restore.cjs → <workspace>
const WORKSPACE = path.resolve(__dirname, '..', '..');
const CONFIGS = path.join(__dirname, 'configs');

function restoreWorkspaceEntry() {
  const src = path.join(CONFIGS, 'workspace-AGENTS.md');
  const dst = path.join(WORKSPACE, 'AGENTS.md');
  if (!fs.existsSync(src)) throw new Error(`缺少备份: ${src}`);
  fs.copyFileSync(src, dst);
  console.log(`✓ 工作区入口 AGENTS.md → ${dst}`);
}

function restoreOpenCodeGlobal() {
  const dst = path.join(os.homedir(), '.config', 'opencode', 'opencode.jsonc');
  const instructionsPath = path
    .join(WORKSPACE, 'docs', 'ecosystem', 'AGENTS.md')
    .replace(/\\/g, '/');
  const content = JSON.stringify(
    {
      $schema: 'https://opencode.ai/config.json',
      instructions: [instructionsPath],
    },
    null,
    2,
  );
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, content, 'utf8');
  console.log(`✓ opencode 全局 → ${dst}`);
  console.log(`  instructions → ${instructionsPath}`);
}

restoreWorkspaceEntry();
restoreOpenCodeGlobal();
console.log('完成。重启 opencode 使全局配置生效。');
