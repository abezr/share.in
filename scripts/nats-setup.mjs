#!/usr/bin/env node
import { execSync } from 'node:child_process';

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

// Requires nats CLI with NKEYS env configured for admin.
const streams = [
  { name: 'agent.logs', subjects: ['agent.logs.*'] },
  { name: 'agent.checkpoints', subjects: ['agent.checkpoints.*'] }
];

for (const s of streams) {
  run(`nats stream add ${s.name} --subjects=${s.subjects.join(',')} --retention=limits --max-msgs=-1 --storage=file --discard=old --dupe-window=2m --defaults || true`);
}

console.log('NATS JetStream streams ensured.');
