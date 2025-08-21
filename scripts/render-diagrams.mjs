
import { execSync } from 'node:child_process';
import { readdirSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';

const inDir = 'docs/diagrams';
const outSvg = 'docs/diagrams/svg';
const outPng = 'docs/diagrams/png';
mkdirSync(outSvg, { recursive: true });
mkdirSync(outPng, { recursive: true });

const files = readdirSync(inDir).filter(f => f.endsWith('.mmd'));
for (const f of files) {
  const base = basename(f, '.mmd');
  const inFile = join(inDir, f);
  execSync(`npx -p @mermaid-js/mermaid-cli mmdc -i ${inFile} -o ${join(outSvg, base + '.svg')}`, { stdio: 'inherit' });
  execSync(`npx -p @mermaid-js/mermaid-cli mmdc -i ${inFile} -o ${join(outPng, base + '.png')}`, { stdio: 'inherit' });
}
console.log('Rendered SVG and PNG into docs/diagrams/svg and docs/diagrams/png');
