// backend/src/worker.ts
import { app } from './app';
import type { Env } from './env';

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(req, env, ctx);
  },
};
