// backend/src/env.ts
export interface Env {
	DB: D1Database;
	API_BASE_URL?: string;
	CORS_ORIGINS?: string;
	JWT_SECRET: string;
	R2_UPLOADS: R2Bucket;
	R2_PUBLIC_URL?: string;
	FILE_SIGN_SECRET: string;
}
