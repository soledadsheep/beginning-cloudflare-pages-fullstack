// backend/src/modules/account/openapis/logout.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountService } from '../account.service';
import { AccountRepository } from '../account.repository';

export class UserLogoutRoute extends OpenAPIRoute {
    override schema = {
        tags: ['User'],
        summary: 'Logout user',
    	security: [{ BearerAuth: [] }],
        responses: {
            200: {
                description: 'Logout result',
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
            const jwtPayload = c.get('jwtPayload');
            if (!jwtPayload) return jsonError('Unauthorized', 401);
            const service = new AccountService(new AccountRepository(c.env));
            return await service.logout(jwtPayload.sub);
        } catch (e: any) {
            return jsonError(e.message ?? 'Invalid request');
        }
    }
}