/**
 * Auth Controller
 * Handles authentication-related API requests
 */

import type { Request, Response } from 'express';
import { Argon2id } from 'oslo/password';
import { generateIdFromEntropySize } from 'lucia';
import { successResponse, HttpStatus } from '../../lib/api-response.js';
import { ApiError } from '../../lib/api-error.js';
import { lucia } from '../../auth/lucia.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { SignupBody, LoginBody } from '../validators/auth.validators.js';

const argon2id = new Argon2id();

/**
 * POST /api/auth/signup
 * Create a new user account
 */
export async function signup(
  req: Request<object, object, SignupBody>,
  res: Response
) {
  const { email, password, name } = req.body;
  
  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  
  if (existingUser) {
    throw ApiError.conflict('An account with this email already exists');
  }
  
  // Hash password
  const hashedPassword = await argon2id.hash(password);
  
  // Create user
  const userId = generateIdFromEntropySize(10);
  
  await db.insert(users).values({
    id: userId,
    email: email.toLowerCase(),
    hashedPassword,
    name: name || null,
  });
  
  // Create session
  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  // Set cookie
  res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  
  res.status(HttpStatus.CREATED).json(successResponse({
    user: {
      id: userId,
      email: email.toLowerCase(),
      name: name || null,
    },
    sessionId: session.id,
  }));
}

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
export async function login(
  req: Request<object, object, LoginBody>,
  res: Response
) {
  const { email, password } = req.body;
  
  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });
  
  if (!user) {
    throw ApiError.invalidCredentials();
  }
  
  // Verify password
  const validPassword = await argon2id.verify(user.hashedPassword, password);
  
  if (!validPassword) {
    throw ApiError.invalidCredentials();
  }
  
  // Create session
  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  
  // Set cookie
  res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  
  res.status(HttpStatus.OK).json(successResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    sessionId: session.id,
  }));
}

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
export async function logout(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  
  if (authReq.session) {
    await lucia.invalidateSession(authReq.session.id);
  }
  
  const sessionCookie = lucia.createBlankSessionCookie();
  res.cookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);
  
  res.status(HttpStatus.OK).json(successResponse({ message: 'Logged out successfully' }));
}

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function me(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  
  // Fetch full user data
  const user = await db.query.users.findFirst({
    where: eq(users.id, authReq.user.id),
    columns: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
  
  if (!user) {
    throw ApiError.notFound('User');
  }
  
  res.status(HttpStatus.OK).json(successResponse(user));
}

/**
 * GET /api/auth/session
 * Check if session is valid
 */
export async function checkSession(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  
  res.status(HttpStatus.OK).json(successResponse({
    valid: true,
    userId: authReq.user.id,
    expiresAt: authReq.session.expiresAt,
  }));
}

