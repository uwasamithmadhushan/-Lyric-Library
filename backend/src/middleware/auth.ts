import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { HttpError } from './error.js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AuthUser;
    }
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new HttpError(401, 'Admin authentication required.'));
    return;
  }

  try {
    const token = header.slice('Bearer '.length);
    const payload = jwt.verify(token, env.jwtSecret) as AuthUser & { role?: string };
    if (payload.role !== 'ADMIN') {
      next(new HttpError(403, 'Only administrators can access this resource.'));
      return;
    }
    req.admin = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired admin session.'));
  }
}

export function signAdminToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: '12h' });
}
