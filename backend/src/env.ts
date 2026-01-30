// backend/src/env.ts
export interface Env {
	DB: D1Database;
	API_BASE_URL?: string;
	CORS_ORIGINS?: string;
	JWT_SECRET: string;
}
