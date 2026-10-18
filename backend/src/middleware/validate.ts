import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

export type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(result.error);
      return;
    }

    if (source === 'body') {
      req.body = result.data;
    } else if (source === 'params') {
      req.params = result.data;
    } else {
      Object.assign(req.query, result.data as Record<string, unknown>);
    }

    next();
  };
}
