import axios, { AxiosError } from 'axios';
import { ExecutionContext } from '../context.js';
import { deepInterpolate, interpolate } from '../interpolate.js';
import { HttpNodeError } from '../../errors.js';
import appConfig from '../../config.js';

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  outputKey: string;
  timeoutMs?: number;
}

export async function execute(config: HttpRequestConfig, context: ExecutionContext): Promise<Record<string, unknown>> {
  
  const url = interpolate(config.url, context.data);
  const headers = config.headers
    ? deepInterpolate(config.headers, context.data) as Record<string, string>
    : undefined;
  const body = config.body ? deepInterpolate(config.body, context.data) : undefined;
  const timeout = config.timeoutMs ?? appConfig.httpRequestTimeoutMs;

  if (!appConfig.allowedHttpDomains.includes('*')) {
    const hostname = new URL(url).hostname;
    if (!appConfig.allowedHttpDomains.includes(hostname)) {
      throw new HttpNodeError('httpRequest', `Domain not allowed: ${hostname}`);
    }
  }

  try {
    const response = await axios({
      method: config.method,
      url,
      headers,
      data: body,
      timeout,
    });
    return { [config.outputKey]: response.data };
  } catch (err) {
    if (err instanceof AxiosError) {
      throw new HttpNodeError(
        'httpRequest',
        `HTTP ${config.method} ${url} failed: ${err.message}`,
      );
    }
    throw err;
  }
}
