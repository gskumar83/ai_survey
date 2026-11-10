import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import prisma from '../prisma';

export interface AdminScope {
  isSuperAdmin: boolean;
  assignedCompanyId: string | null;
  adminId: string;
  role: 'super_admin' | 'org_admin';
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      adminScope?: AdminScope;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error: any) {
    console.log('🚨 [Auth Middleware] Token verification failed:', error?.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    if (req.user.role === 'admin') {
      try {
        let admin: any = null;
        if (/^[0-9a-fA-F]{24}$/.test(req.user.id)) {
          admin = await prisma.admins.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, company_id: true, is_activated: true },
          });
        }

        if (!admin) {
          const envEmail = (process.env.SUPER_ADMIN_EMAIL || process.env.AUTHORIZED_ADMIN_EMAIL || '').trim().toLowerCase();
          if (envEmail) {
            admin = await prisma.admins.findFirst({
              where: { email: { equals: envEmail, mode: 'insensitive' } },
              select: { id: true, email: true, role: true, company_id: true, is_activated: true },
            });
          }
        }

        if (!admin) {
          return res.status(403).json({ error: 'Forbidden: Admin account not found' });
        }

        if (admin.is_activated === false) {
          return res.status(403).json({ error: 'Forbidden: Admin account is inactive or revoked' });
        }

        const envEmail = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
        const isSuperAdmin = admin.role === 'super_admin' || (envEmail && admin.email.toLowerCase() === envEmail);

        req.adminScope = {
          isSuperAdmin: !!isSuperAdmin,
          assignedCompanyId: isSuperAdmin ? null : (admin.company_id || null),
          adminId: admin.id,
          role: isSuperAdmin ? 'super_admin' : 'org_admin',
          email: admin.email,
        };

        const isMeRoute = req.path === '/me' || req.originalUrl?.includes('/api/admin/me');
        if (!isSuperAdmin && !admin.company_id && !isMeRoute) {
          return res.status(403).json({ error: 'Forbidden: No organization assigned. Please contact Super Admin.' });
        }
      } catch (err: any) {
        console.warn('⚠️ [authorizeRole:admin] Error verifying admin scope from DB:', err?.message || err);
        return res.status(403).json({ error: 'Forbidden: Could not verify administrator authorization' });
      }
    }

    next();
  };
};

export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.adminScope?.isSuperAdmin) {
    return res.status(403).json({ error: 'Forbidden: Super Admin privileges required' });
  }
  next();
};

export const getAdminScope = (req: Request): AdminScope => {
  if (!req.adminScope) {
    const error: any = new Error('Forbidden: Administrator authorization required');
    error.statusCode = 403;
    throw error;
  }
  return req.adminScope;
};

