// backend/src/modules/account/openapi/register.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { RegisterSchema, UserSchema } from '../account.types';

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
							user: UserSchema
								.omit({ password_hash: true })
								.optional(),
							message: z.string().optional(),
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
			return await service.register(body);
		} catch (e: any) {
			return jsonError(e.errors?.[0]?.message ?? e.message ?? 'Invalid request');
		}
	}
}
