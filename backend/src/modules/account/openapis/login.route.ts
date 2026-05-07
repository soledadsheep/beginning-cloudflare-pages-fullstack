// backend/src/modules/account/openapi/login.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { LoginSchema, UserSchema } from '../account.types';
import { createAccountService } from '../account.factory';

export class UserLoginRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		summary: 'Login with username/email and password',
		request: {
			body: {
				content: {
					'application/json': {
						schema: LoginSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Login successful',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
							data: z.object({
								user: UserSchema.omit({ password_hash: true, email_confirm: true, is_locked: true, lock_until: true, login_fail_count: true, token_version: true }).optional(),
								access_token: z.string(),
								token_type: z.literal('Bearer'),
								expires_in: z.number(),
							}).optional(),
						}),
					},
				},
			},
			400: {
				description: 'Invalid credentials',
				content: {
					'application/json': {
						schema: z.object({
							success: z.literal(false),
							message: z.string(),
						}),
					},
				},
			},
			401: { description: 'Invalid credentials' },
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.login(body, c.env.JWT_SECRET);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
