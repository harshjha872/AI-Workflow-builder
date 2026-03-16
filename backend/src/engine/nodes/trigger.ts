import { ExecutionContext } from '../context.js';

export interface TriggerConfig {
  triggerType: 'manual' | 'webhook';
  inputSchema?: Record<string, unknown>;
  inputFields?: Array<{ key: string; value: string }>;
}

export async function execute(config: TriggerConfig, context: any): Promise<Record<string, unknown>> {
  const input = context.data['input'];
  if (!input) {
    throw new Error('Trigger node requires input data');
  }
  return { trigger: input };
}
