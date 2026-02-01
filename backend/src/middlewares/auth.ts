// backend/src/middlewares/auth.ts
import { createMiddleware } from 'hono/factory';
import { sign, verify } from 'hono/jwt';
import type { Env } from '../env';

export type AuthPayload = {
  sub: number;
  user_name: string;
  email: string;
  culture_code: string;
  permissions?: string[];
  exp: number;
  ver: number;
};

export async function signToken(payload: Omit<AuthPayload, 'exp'>, secret?: string | null, expiresInSec = 60 * 60 * 24): Promise<string> {
  const key = secret ?? (globalThis as any).env?.JWT_SECRET;
  if (!key) throw new Error('JWT_SECRET is not defined');
  return sign({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSec }, key, 'HS256');
}

export const authMiddleware = createMiddleware<{ Bindings: Env; Variables: { jwtPayload: AuthPayload; }; }>(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return c.json({ success: false, message: 'Unauthorized' }, 401);

  try {
      const token = auth.slice(7);
      const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
      c.set('jwtPayload', payload as AuthPayload);

      const user = await c.env.DB
        .prepare('SELECT token_version FROM users WHERE id = ?')
        .bind(payload.sub)
        .first<{ token_version: number }>();
      if (!user || user.token_version !== payload.ver) return c.json({ success: false, message: 'Token revoked' }, 401);

      return await next();
  } catch {
      return c.json({ success: false, message: 'Invalid token' }, 401);
  }
});

export function requirePermission(permission: string) {
  return createMiddleware(async (c, next) => {
    if (!c.get('jwtPayload')?.permissions?.includes(permission)) return c.json({ success: false, message: 'Forbidden' }, 403);
    return await next();
  });
}