// backend/src/shared/validator.ts
import { HonoRequest } from 'hono/request';
import { z } from 'zod';

export async function parseBody<T>(req: HonoRequest, schema: z.ZodSchema<T>): Promise<T> {
	const body = await req.json();
	return schema.parse(body);
}
