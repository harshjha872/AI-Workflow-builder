import { ExecutionContext } from '../context.js';

export interface TriggerConfig {
  triggerType: 'manual' | 'webhook';
  inputSchema?: Record<string, unknown>;
}

export async function execute(config: TriggerConfig, context: ExecutionContext): Promise<Record<string, unknown>> {
  const input = context.get('input') as Record<string, unknown> | undefined;
  if (!input) {
    throw new Error('Trigger node requires input data');
  }
  return { trigger: input };
}
