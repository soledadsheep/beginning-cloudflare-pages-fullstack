// backend/src/modules/account/openapi/login.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { LoginSchema, UserSchema } from '../account.types';

export class UserLoginRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		summary: 'Login user',
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
				description: 'Login result',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							user: UserSchema.omit({ password_hash: true }).optional(),
							message: z.string().optional(),
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
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = new AccountService(new AccountRepository(c.env));
			return await service.login(body, c.env.JWT_SECRET);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
