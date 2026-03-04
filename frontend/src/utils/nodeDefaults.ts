export const NODE_DEFAULTS = {
  trigger: { triggerType: 'manual', inputSchema: '' },
  llmCall: {
    provider: 'openai',
    model: 'gpt-4o',
    systemPrompt: 'You are a helpful assistant.',
    userPrompt: '',
    outputKey: 'result',
    maxTokens: 1024
  },
  httpRequest: {
    method: 'GET',
    url: '',
    headers: {} as Record<string, string>,
    body: '',
    outputKey: 'response',
    timeoutMs: 10000
  },
  condition: {
    expression: 'context.score > 0.5',
    truePath: '',
    falsePath: ''
  },
  transform: {
    code: 'return { output: context.input }',
    outputKey: 'transformed'
  },
  output: {
    outputKeys: ['result'],
    format: 'json'
  }
} as const;

export type NodeDefaults = typeof NODE_DEFAULTS;

