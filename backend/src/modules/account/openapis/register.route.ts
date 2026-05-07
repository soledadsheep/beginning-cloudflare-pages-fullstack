// backend/src/modules/account/openapi/register.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { RegisterSchema, UserSchema } from '../account.types';
import { createAccountService } from '../account.factory';

export class UserRegisterRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		summary: 'Register user',
		request: {
			body: {
				content: {
					'application/json': {
						schema: RegisterSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Register result',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
							user: UserSchema
								.omit({ password_hash: true })
								.optional(),
						}),
					},
				},
			},
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = createAccountService(c.env);
			return await service.register(body);
		} catch (e: any) {
			return jsonError(e.errors?.[0]?.message ?? e.message ?? 'Invalid request');
		}
	}
}
