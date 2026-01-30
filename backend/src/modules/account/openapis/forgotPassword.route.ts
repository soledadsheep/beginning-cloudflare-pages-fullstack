// backend/src/modules/account/openapi/forgotPassword.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { ForgotPasswordSchema } from '../account.types';

export class UserForgotPasswordRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		summary: 'Forgot password',
		request: {
			body: {
				content: {
					'application/json': {
						schema: ForgotPasswordSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Request accepted',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
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
			return await service.forgotPassword(body);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
