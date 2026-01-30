// backend/src/modules/account/openapi/resetPassword.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { ResetPasswordSchema } from '../account.types';

export class UserResetPasswordRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		summary: 'Reset password',
    	security: [{ BearerAuth: [] }],
		request: {
			body: {
				content: {
					'application/json': {
						schema: ResetPasswordSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Reset result',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
						}),
					},
				},
			},
			401: {
				description: 'Unauthorized',
			},
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = new AccountService(new AccountRepository(c.env));
			return await service.resetPassword(body);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
