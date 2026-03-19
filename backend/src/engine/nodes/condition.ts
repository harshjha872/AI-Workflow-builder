import { ExecutionContext } from '../context.js';

export interface ConditionConfig {
  expression: string;
  truePath: string;
  falsePath: string;
}

export async function execute(config: ConditionConfig, context: any): Promise<Record<string, unknown>> {
  let result: boolean;
  try {
    const fn = new Function('context', `return ${config.expression}`);
    result = Boolean(fn(context.data));
  } catch {
    result = false;
  }

  return {
    _conditionResult: result,
    _branch: result ? "true" : "false",
  };
}
