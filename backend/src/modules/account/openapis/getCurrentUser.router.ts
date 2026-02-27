// backend/src/modules/account/openapi/getCurrentUser.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';

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
			const service = new AccountService(new AccountRepository(c.env));
            const jwt = c.get('jwtPayload');
			return await service.getCurrentUser(jwt);
		} catch (e: any) {
			return jsonError(e.message ?? 'Invalid request');
		}
	}
}
