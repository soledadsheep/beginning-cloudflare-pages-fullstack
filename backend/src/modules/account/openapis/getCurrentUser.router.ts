// backend/src/modules/account/openapi/getCurrentUser.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { UserSchema } from '../account.types';
import { createAccountService } from '../account.factory';

export class UserCurrentRoute extends OpenAPIRoute {
	override schema = {
		tags: ['User'],
		security: [{ BearerAuth: [] }],
		summary: 'Get current user information',
		responses: {
			200: {
				description: 'Request accepted',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
							data: UserSchema.omit({ password_hash: true }).optional(),
						}),
					},
				},
			},
			401: {
				description: 'Unauthorized',
				content: {
					'application/json': {
						schema: z.object({
							success: z.boolean().default(false),
							message: z.string().default('Unauthorized'),
						}),
					},
				},
			},
		},
	};
	override async handle(c: AppContext) {
		try {
			const service = createAccountService(c.env);
			const jwt = c.get('jwtPayload');
			return await service.getCurrentUser(jwt);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
