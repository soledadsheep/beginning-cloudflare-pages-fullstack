// src/app.ts
import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './env';
import { authMiddleware, requirePermission } from './middlewares/auth';
import { accountOpenApi } from './modules/account/account.openapi';
import { FileOpenApi } from './modules/attachment/attachment.openapi';

export const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allow = c.env.CORS_ORIGINS
        .split(',')
        .map((o: string) => o.trim().replace(/\/$/, ''))
        .filter(Boolean)
        .concat(['http://localhost:5173']);

      if (!origin) return '*';  // Nếu không có Origin header (server-to-server, curl, Postman...)
      if (allow.includes(origin)) return origin;

      return ''; // Block tất cả origin khác
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // cache preflight 24h
    credentials: false, // nếu dùng cookie/auth header
  })
);

// --- OpenAPI adapter ---
export const openapi = fromHono(app, {
  docs_url: '/openapi',
  schema: {
    info: {
      title: 'Backend API',
      version: '1.0.0',
      description: 'API documentation for Cloudflare Workers',
    },
  } as any,
});
openapi.registry.registerComponent('securitySchemes', 'BearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});
accountOpenApi(openapi, authMiddleware, requirePermission);
FileOpenApi(openapi, authMiddleware, requirePermission);

export default app;