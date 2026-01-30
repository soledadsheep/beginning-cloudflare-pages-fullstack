// backend/src/modules/account/openapi/changePassword.route.ts
import { OpenAPIRoute } from 'chanfana';
import { z } from 'zod';
import { jsonError } from '../../../shared/response'
import type { AppContext } from '../../../types';
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { ChangePasswordSchema } from '../account.types';

export class UserChangePasswordRoute extends OpenAPIRoute {
    override schema = {
        tags: ['User'],
        summary: 'Change user password',
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: ChangePasswordSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Change password result',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.boolean(),
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
            const jwt = c.get('jwtPayload');
            return await service.changePassword({ ...body }, jwt);
        } catch (e: any) {
            return jsonError(e.errors?.[0]?.message ?? e.message ?? 'Invalid request');
        }
    }
}