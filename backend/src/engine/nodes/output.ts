import { ExecutionContext } from '../context.js';

export interface OutputConfig {
  outputKeys: string[];
  format?: 'json' | 'text' | 'markdown';
}

export async function execute(config: OutputConfig, context: ExecutionContext): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const key of config.outputKeys) {
    const value = context.get(key);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return { result };
}
