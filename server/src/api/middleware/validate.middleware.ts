/**
 * Validation Middleware
 * Uses Zod schemas to validate request data
 */

import type { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { ApiError } from '../../lib/api-error.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Middleware factory that validates request against Zod schemas
 * 
 * Usage:
 * router.get('/stocks/:symbol', validate({ params: symbolParamsSchema }), controller.getStock)
 */
export function validate(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Validate each part of the request
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        next(ApiError.validation(formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

/**
 * Pre-built validators for common patterns
 */
export const commonValidators = {
  // Symbol parameter (e.g., AAPL, BTC)
  symbolParam: z.object({
    symbol: z.string().min(1).max(10).toUpperCase(),
  }),
  
  // Multiple symbols in query (e.g., ?symbols=AAPL,GOOGL)
  symbolsQuery: z.object({
    symbols: z.string().transform((s) => s.split(',').map((sym) => sym.trim().toUpperCase())),
  }),
  
  // Pagination query
  paginationQuery: z.object({
    page: z.string().optional().transform((s) => (s ? parseInt(s, 10) : 1)),
    limit: z.string().optional().transform((s) => (s ? Math.min(parseInt(s, 10), 100) : 20)),
  }),
  
  // UUID parameter
  uuidParam: z.object({
    id: z.string().uuid(),
  }),
};

