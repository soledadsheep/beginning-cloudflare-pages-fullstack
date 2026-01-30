// backend/src/shared/db/d1.ts
import type { Env } from '../../env';

export function getDb(env: Env) {
	if (!env.DB) throw new Error('D1 database not bound');
	return env.DB;
}
