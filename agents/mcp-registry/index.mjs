// Minimal capability-based MCP registry resolver
// Given a task, infer needed capabilities and return servers to connect.

const CATALOG = [
  { name: 'aws-ecr', caps: ['container', 'registry', 'aws'] },
  { name: 'gcp-artifact-registry', caps: ['container', 'registry', 'gcp'] },
  { name: 'vercel', caps: ['edge-worker', 'frontend', 'deploy'] },
  { name: 'cloudflare-workers', caps: ['edge-worker', 'deploy', 'cloudflare'] },
  { name: 'kubernetes', caps: ['k8s', 'deploy'] }
];

export function inferCapabilities(task) {
  const caps = new Set();
  if (task.workload === 'container') caps.add('container').add('registry');
  if (task.workload === 'k8s') caps.add('k8s').add('deploy');
  if (task.workload === 'edge-worker') caps.add('edge-worker').add('deploy');
  if (task.target?.name?.includes('aws')) caps.add('aws');
  if (task.target?.name?.includes('gcp')) caps.add('gcp');
  if (task.target?.name?.includes('cloudflare')) caps.add('cloudflare');
  return [...caps];
}

export function selectServers(task) {
  const caps = inferCapabilities(task);
  return CATALOG.filter(s => s.caps.every(c => caps.includes(c))).map(s => s.name);
}
