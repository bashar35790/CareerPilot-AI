import { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../lib/errors';
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from '../lib/tokens';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.[ACCESS_TOKEN_COOKIE];

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedError('Authentication required');
    }

    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}
