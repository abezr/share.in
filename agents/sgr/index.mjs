import Ajv from 'ajv';
import addFormats from 'ajv-formats';

export const schemas = {
  ConversionTask: {
    type: 'object',
    additionalProperties: false,
    properties: {
      source: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      target: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      workload: { enum: ['container', 'k8s', 'edge-worker', 'db', 'queue'] },
      constraints: {
        type: 'object',
        properties: {
          budgetUSD: { type: 'number', minimum: 0 },
          freeTierOnly: { type: 'boolean' },
          regionPref: { type: 'string' },
          zeroDowntime: { type: 'boolean' }
        },
        additionalProperties: true
      }
    },
    required: ['source', 'target', 'workload']
  },
  ConversionPlanStep: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      action: {
        enum: [
          'analyze_repo',
          'generate_artifact',
          'apply_iac',
          'deploy',
          'switch_traffic',
          'rollback',
          'verify'
        ]
      },
      inputs: { type: 'object', additionalProperties: true },
      expectedArtifacts: { type: 'array', items: { type: 'string' } },
      rollbackOf: { type: 'string' }
    },
    required: ['id', 'action']
  },
  ValidationReport: {
    type: 'object',
    properties: {
      checks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              enum: ['health', 'opa_policy', 'sast', 'container_vuln', 'latency', 'diff_output']
            },
            status: { enum: ['pass', 'fail', 'warn'] },
            details: { type: 'string' }
          },
          required: ['name', 'status']
        }
      },
      recommendation: { enum: ['continue', 'retry', 'rollback'] }
    },
    required: ['checks', 'recommendation']
  }
};

export function createValidator() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  Object.entries(schemas).forEach(([k, schema]) => ajv.addSchema(schema, k));
  return ajv;
}

export function validatePlan(plan) {
  const ajv = createValidator();
  const validate = ajv.compile({ type: 'array', items: { $ref: 'ConversionPlanStep' } });
  const valid = validate(plan);
  return { valid, errors: validate.errors ?? null };
}
