// backend/src/modules/account/openapi/getUser.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { GetUserSchema } from '../account.types';

export class GetUserRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
    	security: [{ BearerAuth: [] }],
		summary: 'Get list of users',
		request: {
			body: {
				content: {
					'application/json': {
						schema: GetUserSchema,
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
			401: {
				description: 'Unauthorized',
			},
		},
	};
	override async handle(c: AppContext) {
		try {
			const { body } = await this.getValidatedData<typeof this.schema>();
			const service = new AccountService(new AccountRepository(c.env));
			return await service.getUser(body);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
