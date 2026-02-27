// backend/src/modules/account/openapis/logout.route.ts
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from '../../../types';
import { signFile } from '../attachment.config';
import { jsonSuccess } from '../../../shared/response'
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export class CreateSignRoute extends OpenAPIRoute {
    override schema = {
        tags: ['Attachment'],
        summary: 'Create signed URL for file download',
        security: [{ BearerAuth: [] }],
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: z.object({
                            path: z.string().min(1).max(1024).openapi({
                                description: 'Đường dẫn file trong R2',
                                example: 'private/docs/2024/abc.pdf',
                            }),
                            expireInSec: z.number().min(60).max(86400).openapi({
                                description: 'Thời gian hết hạn (giây). Tối thiểu 60s, tối đa 86400s (24h)',
                                example: 3600,
                            }),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Signed URL created',
                content: {
                    'application/json': {
                        schema: z.object({
                            success: z.literal(true),
                            data: z.object({
                                url: z.string(),
                                path: z.string(),
                                exp: z.number(),
                                sig: z.string(),
                            }),
                        }),
                    },
                },
            },
            400: { description: 'Bad request' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
        },
    };
    override async handle(c: AppContext) {
        const { body } = await this.getValidatedData<typeof this.schema>();
        const exp = Date.now() + body.expireInSec * 1000;
        const sig = await signFile(body.path, exp, c.env.FILE_SIGN_SECRET);
        const obj = await c.env.R2_UPLOADS.get(body.path);
        if (!obj) return c.text('Not found', 404);

        const url =
        `${c.env.API_BASE_URL}/api/attachment/` +
        `${encodeURIComponent(body.path)}?exp=${exp}&sig=${encodeURIComponent(sig)}`;

        return jsonSuccess({ url, path: body.path, exp, sig });
    }
}