// backend/src/modules/account/openapi/register.route.ts
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from '../../../types';
import z from 'zod';
import { jsonSuccess } from '../../../shared/response';

export class DeleteRoute extends OpenAPIRoute {
    override schema = {
        tags: ['Attachment'],
        summary: 'Delete attachment',
        security: [{ BearerAuth: [] }],
        request: {
            body: {
                required: true,
                content: {
                    'application/json': {
                        schema: z.object({
                            ids: z.array(z.string().uuid()).min(1),
                        }),
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Delete success',
            },
            404: {
                description: 'Not found',
            },
        },
    };
    override async handle(c: AppContext) {
        const { body } = await this.getValidatedData<typeof this.schema>();
        const { ids } = body;

        const placeholders = ids.map(() => '?').join(',');
        const rows = await c.env.DB
            .prepare(`SELECT id, saved_path FROM files WHERE id IN (${placeholders})`)
            .bind(...ids)
            .all<{ id: string; saved_path: string }>();

        if (!rows.results.length) return c.json({ success: false, message: 'Files not found' }, 404);

        await Promise.all(rows.results.map(r => c.env.R2_UPLOADS.delete(r.saved_path)));

        await c.env.DB
            .prepare(`DELETE FROM files WHERE id IN (${placeholders})`)
            .bind(...ids)
            .run();

        return jsonSuccess({
            deleted: rows.results.map(r => r.id),
        });
    }
}