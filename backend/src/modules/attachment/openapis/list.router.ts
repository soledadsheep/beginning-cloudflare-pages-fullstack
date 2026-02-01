// backend/src/modules/account/openapi/register.route.ts
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from '../../../types';
import z from 'zod';
import { jsonSuccess } from '../../../shared/response';

export class ListAttachmentRoute extends OpenAPIRoute {
    override schema = {
        tags: ['Attachment'],
        summary: 'List attachments',
        security: [{ BearerAuth: [] }],
        request: {
            query: z.object({
                category: z.string().optional(),
                page: z.coerce.number().min(1).default(1),
                pageSize: z.coerce.number().min(1).max(100).default(10),
            }),
        },
        responses: {
            200: {
                description: 'List of attachments',
            },
        },
    };
    override async handle(c: AppContext) {
        const { query } = await this.getValidatedData<typeof this.schema>();
        const { category, page, pageSize } = query;
        const offset = (page - 1) * pageSize;

        let stmt;

        if (category) {
            stmt = c.env.DB.prepare(`
                SELECT id, category, original_name, saved_path, mime_type, size, description, created_at
                FROM files
                WHERE category = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `).bind(category, pageSize, offset);
        }
        else {
            stmt = c.env.DB.prepare(`
                SELECT id, category, original_name, saved_path, mime_type, size, description, created_at
                FROM files
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            `).bind(pageSize, offset);
        }

        const { results } = await stmt.all();

        return jsonSuccess({
            attachments: results,
        });
    }
}