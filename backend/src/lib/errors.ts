export interface AppErrorOptions {
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
    this.isOperational = true;
    if (options.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
    Object.setPrototypeOf(this, new.target.prototype);
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, new.target);
    }
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', options: AppErrorOptions = {}) {
    super(message, 400, 'BAD_REQUEST', options);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', options: AppErrorOptions = {}) {
    super(message, 401, 'UNAUTHORIZED', options);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', options: AppErrorOptions = {}) {
    super(message, 403, 'FORBIDDEN', options);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', options: AppErrorOptions = {}) {
    super(message, 404, 'NOT_FOUND', options);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', options: AppErrorOptions = {}) {
    super(message, 409, 'CONFLICT', options);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', options: AppErrorOptions = {}) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', options);
  }
}

export class AIServiceError extends AppError {
  constructor(message = 'AI service unavailable', options: AppErrorOptions = {}) {
    super(message, 503, 'AI_SERVICE_UNAVAILABLE', options);
  }
}
