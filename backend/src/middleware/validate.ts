import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const error = Object.assign(new Error('Validation failed'), {
          status: 400,
          code: 'VALIDATION_ERROR',
          details: err.errors,
        });
        next(error);
      } else {
        next(err);
      }
    }
  };
}
