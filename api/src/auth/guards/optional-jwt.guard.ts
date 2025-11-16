import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: Record<string, unknown>;
};

/**
 * Allows requests without an Authorization header to pass through while still
 * authenticating signed-in users, enabling personalization without blocking
 * anonymous traffic.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers?.authorization;
    if (!authorization) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: unknown,
    user: TUser,
    _info?: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    void _info;
    void _context;
    void _status;
    if (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('Authentication validation failed');
    }
    return user;
  }
}
