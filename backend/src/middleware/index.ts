import { Request, Response, NextFunction } from 'express';
import { sendError } from '../lib/response';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error('Unhandled application error:', err.message);
  return sendError(res, 'Internal server error', 500, 'INTERNAL_SERVER_ERROR');
}
