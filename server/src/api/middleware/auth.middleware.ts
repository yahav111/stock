/**
 * Authentication Middleware
 * Verifies user sessions using Lucia
 */

import type { Request, Response, NextFunction } from 'express';
import { lucia } from '../../auth/lucia.js';
import { ApiError } from '../../lib/api-error.js';
import type { User, Session } from 'lucia';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user: User;
  session: Session;
}

/**
 * Extracts session token from request
 */
function getSessionToken(req: Request): string | null {
  // Check Authorization header first (for API clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  
  // Fall back to cookie
  const sessionCookie = req.cookies?.[lucia.sessionCookieName];
  return sessionCookie || null;
}

/**
 * Middleware that requires authentication
 * Throws 401 if not authenticated
 */
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = getSessionToken(req);
    
    if (!sessionToken) {
      throw ApiError.unauthorized('No session token provided');
    }
    
    const { session, user } = await lucia.validateSession(sessionToken);
    
    if (!session || !user) {
      throw ApiError.unauthorized('Invalid or expired session');
    }
    
    // Attach user and session to request
    (req as AuthenticatedRequest).user = user;
    (req as AuthenticatedRequest).session = session;
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(ApiError.unauthorized());
    }
  }
}

/**
 * Middleware that optionally authenticates
 * Doesn't throw if not authenticated, but attaches user if available
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const sessionToken = getSessionToken(req);
    
    if (sessionToken) {
      const { session, user } = await lucia.validateSession(sessionToken);
      
      if (session && user) {
        (req as AuthenticatedRequest).user = user;
        (req as AuthenticatedRequest).session = session;
      }
    }
    
    next();
  } catch {
    // Silently continue without auth
    next();
  }
}

/**
 * Type guard to check if request is authenticated
 */
export function isAuthenticated(req: Request): req is AuthenticatedRequest {
  return 'user' in req && 'session' in req;
}

