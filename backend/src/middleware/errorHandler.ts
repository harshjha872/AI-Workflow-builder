import { Request, Response, NextFunction } from 'express';
import config from '../config.js';
import logger from './requestLogger.js';

interface AppError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void {
  const status = err.status ?? 500;
  logger.error({ err, method: req.method, url: req.url }, err.message);
  res.status(status).json({
    error: err.message,
    code: err.code ?? 'INTERNAL_ERROR',
    ...(err.details ? { details: err.details } : {}),
    ...(config.nodeEnv !== 'production' ? { stack: err.stack } : {}),
  });
}
