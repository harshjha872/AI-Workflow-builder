import { VM } from 'vm2';
import { ExecutionContext } from '../context.js';
import { TransformTimeoutError } from '../../errors.js';
import appConfig from '../../config.js';

export interface TransformConfig {
  code: string;
  outputKey: string;
}

export async function execute(config: TransformConfig, context: ExecutionContext): Promise<Record<string, unknown>> {
  const vm = new VM({
    timeout: appConfig.transformTimeoutMs,
    sandbox: { context: context.data },
  });

  try {
    const result = vm.run(`(function() { ${config.code} })()`);
    return { [config.outputKey]: result };
  } catch (err) {
    if (err instanceof Error && err.message.includes('Script execution timed out')) {
      throw new TransformTimeoutError(config.outputKey);
    }
    throw err;
  }
}
