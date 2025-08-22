import { execSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const zipPath = join(dist, 'helios-starter.zip');

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

function ensureDiagrams() {
  const svgDir = 'docs/diagrams/svg';
  const pngDir = 'docs/diagrams/png';
  if (!existsSync(svgDir) || !existsSync(pngDir)) {
    console.log('Diagrams not rendered yet; rendering now...');
    run('node scripts/render-diagrams.mjs');
  }
}

function packageZip() {
  mkdirSync(dist, { recursive: true });
  // Build inclusion list
  const include = [
    'README.md',
    'docs',
    'docs/diagrams/svg',
    'docs/diagrams/png',
    'apps/extension'
  ].join(' ');

  // Exclusions: raw .mmd sources, node_modules, dotfiles except README/docs/apps
  const exclude = [
    '\n',
    // Exclude all node_modules
    "-x '*node_modules*'",
    // Exclude VCS and CI
    "-x '.git*'",
    "-x '.github/*'",
    // Exclude mmd sources from docs root (we already include svgs/pngs)
    "-x 'docs/diagrams/*.mmd'",
    // Exclude dist itself to avoid nesting
    "-x 'dist/*'"
  ].join(' ');

  // Use system zip (present on GitHub runners and most dev envs)
  run(`zip -r ${zipPath} ${include} ${exclude}`);
  console.log(`Packaged ${zipPath}`);
}

ensureDiagrams();
packageZip();
