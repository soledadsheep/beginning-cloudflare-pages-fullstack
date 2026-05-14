// backend/src/worker.ts
import { app } from './app';
import type { Env } from './env';
import { setCurrentEnv } from './shared/db/d1';

export default {
  fetch(req: Request, env: Env, ctx: ExecutionContext) {
    // Tự động set BACKEND_URL từ request
    env.BACKEND_URL = new URL(req.url).origin;
    setCurrentEnv(env);
    return app.fetch(req, env, ctx);
  },
};
