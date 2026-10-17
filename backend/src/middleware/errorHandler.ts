import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError, NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { sendError } from '../lib/response';

interface PrismaLikeError {
  code: string;
  meta?: { target?: string[] };
}

interface SyntaxErrorLike extends SyntaxError {
  body?: unknown;
  status?: number;
}

function isPrismaError(error: unknown): error is PrismaLikeError {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && /^P\d{4}$/.test(code);
}

function isJsonSyntaxError(error: unknown): error is SyntaxErrorLike {
  return error instanceof SyntaxError && 'body' in error;
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Internal server error';
  let details: unknown;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid request parameters';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      issue: issue.message,
    }));
  } else if (isJsonSyntaxError(err)) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Request body contains malformed JSON';
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (isPrismaError(err)) {
    if (err.code === 'P2002') {
      statusCode = 409;
      code = 'CONFLICT';
      message = `A record with this ${err.meta?.target?.join(', ') ?? 'value'} already exists`;
    } else if (err.code === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = 'Requested resource does not exist';
    } else if (err.code === 'P2003') {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'Operation violates a relational constraint';
    } else {
      statusCode = 400;
      code = 'DATABASE_ERROR';
      message = 'The database rejected the operation';
    }
  }

  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    userId: (req as { user?: { id?: string } }).user?.id,
    message: err instanceof Error ? err.message : String(err),
    ...(env.isProduction || !(err instanceof Error) ? {} : { stack: err.stack }),
  };

  if (statusCode >= 500) {
    logger.error('Request failed', logMeta);
  } else {
    logger.warn('Request rejected', logMeta);
  }

  const clientMessage =
    statusCode >= 500 && !(err instanceof AppError) ? 'Internal server error' : message;

  sendError(res, clientMessage, statusCode, code, details);
}
