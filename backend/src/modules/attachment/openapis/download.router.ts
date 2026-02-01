// backend/src/modules/upload/openapis/download.route.ts
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from '../../../types';
import { verifyFileSig } from '../attachment.config';
import { z } from 'zod';

export class DownloadRoute extends OpenAPIRoute {
    override schema = {
        tags: ['Attachment'],
        summary: 'Download attachment (signed)',
        request: {
            params: z.object({
                path: z.string(),
            }),
            query: z.object({
                sig: z.string(),
                exp: z.number().min(0),
            }),
        },
        responses: {
            200: {
                description: 'File stream',
            },
            403: {
                description: 'Forbidden',
            },
            404: {
                description: 'Not found',
            },
        },
    };
    override async handle(c: AppContext) {
        const path = c.req.param('path');
        const sig = c.req.query('sig');
        const exp = Number(c.req.query('exp'));
        if (!sig || !exp) return c.text('Forbidden', 403);

        const ok = await verifyFileSig(path, exp, c.env.FILE_SIGN_SECRET, sig);
        if (!ok) return c.text('Forbidden', 403);

        const obj = await c.env.R2_UPLOADS.get(path);
        if (!obj) return c.text('Not found', 404);

        return new Response(obj.body, {
            headers: {
                'Content-Type':
                obj.httpMetadata?.contentType ?? 'application/octet-stream',
                'Cache-Control': 'private, max-age=300',
            },
        });
    }
}
