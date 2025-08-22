import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlan } from '../agents/sgr/index.mjs';

test('validatePlan accepts minimal valid plan', () => {
  const plan = [
    { id: '1', action: 'analyze_repo' },
    { id: '2', action: 'generate_artifact', inputs: { type: 'iac' } }
  ];
  const { valid, errors } = validatePlan(plan);
  assert.equal(valid, true, JSON.stringify(errors));
});

test('validatePlan rejects invalid action', () => {
  const plan = [ { id: '1', action: 'unknown' } ];
  const { valid } = validatePlan(plan);
  assert.equal(valid, false);
});
