// backend/src/shared/db/d1.ts
import type { Env } from '../../env';

let _currentEnv: Env | null = null;

/**
 * Gọi một lần trong mỗi request handler, trước khi xử lý.
 */
export function setCurrentEnv(env: Env) {
    _currentEnv = env;
}

export function getDb(): D1Database {
    if (!_currentEnv) {
        throw new Error('Current env chưa được set. Hãy gọi setCurrentEnv(env) trong fetch.');
    }
    return _currentEnv.DB; // đúng tên binding D1 của bạn
}