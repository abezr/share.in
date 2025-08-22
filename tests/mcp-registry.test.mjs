import test from 'node:test';
import assert from 'node:assert/strict';
import { inferCapabilities, selectServers } from '../agents/mcp-registry/index.mjs';

test('inferCapabilities from task', () => {
  const caps = inferCapabilities({ workload: 'k8s', target: { name: 'gcp-europe' } });
  assert.ok(caps.includes('k8s'));
  assert.ok(caps.includes('deploy'));
  assert.ok(caps.includes('gcp'));
});

test('selectServers chooses minimal set', () => {
  const servers = selectServers({ workload: 'edge-worker', target: { name: 'cloudflare' } });
  assert.ok(servers.includes('cloudflare-workers'));
  assert.equal(servers.includes('kubernetes'), false);
});
