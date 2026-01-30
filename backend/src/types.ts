// backend/src/types.ts
import type { Context } from 'hono';
import type { Env } from './env';

export type AppContext = Context<{ Bindings: Env }>;
