// backend/src/modules/upload/openapis/upload.route.ts
import { OpenAPIRoute } from 'chanfana';
import type { AppContext } from '../../../types';
import { randomCode } from '../../../shared/utils';
import { UploadSchema, UploadResponseSchema } from '../attachment.types';
import { ALLOWED_MIME, MAX_FILE_SIZE, signFile } from '../attachment.config';
import { jsonSuccess } from '../../../shared/response';

export class UploadRoute extends OpenAPIRoute {
	override schema = {
		tags: ['Attachment'],
		summary: 'Upload attachments',
		security: [{ BearerAuth: [] }],
		request: {
			body: {
      			required: true,
				description: 'Upload file',
				content: {
					'multipart/form-data': {
						schema: UploadSchema,
					},
				},
			},
		},
		responses: {
			200: {
				description: 'Upload success',
				content: {
					'application/json': {
						schema: UploadResponseSchema,
					},
				},
			},
		},
	};
	override async handle(c: AppContext) {
		const form = await c.req.formData();
		const category = (form.get('category') as string) || 'default';
		const description = form.get('description') as string | null;
		const files = form.getAll('files') as unknown as File[];
		if (!files.length) return c.json({ success: false, message: 'No files uploaded' }, 400);

		const results = [];

		for (const file of files) {
			if (file.size > MAX_FILE_SIZE) return c.json({ success: false, message: `File too large: ${file.name}` }, 400);
			if (!ALLOWED_MIME.includes(file.type)) return c.json({ success: false, message: `Invalid mime type: ${file.name}` }, 400);

			const date = new Date();
			const folder = `${category}/${date.getFullYear()}/${date.getMonth() + 1}`;
			const ext = file.name.split('.').pop();
			const filename = `${randomCode(16)}.${ext}`;
			const path = `${folder}/${filename}`;

			await c.env.R2_UPLOADS.put(path, await file.arrayBuffer(), {
				httpMetadata: { contentType: file.type },
			});

			const id = crypto.randomUUID();
			await c.env.DB.prepare(`
					INSERT INTO files (id, category, original_name, saved_path, mime_type, size, description)
					VALUES (?, ?, ?, ?, ?, ?, ?)
				`)
				.bind(id, category, file.name, path, file.type, file.size, description)
				.run();

			const exp = Date.now() + 1000 * 60 * 60 * 1; // 1 hours
			const sig = await signFile(path, exp, c.env.FILE_SIGN_SECRET);
			const downloadUrl = 
			`${c.env.API_BASE_URL}/api/attachment/download/`+
			`${encodeURIComponent(path)}?exp=${exp}&sig=${encodeURIComponent(sig)}`;
			const publicUrl = c.env.R2_PUBLIC_URL ? `${c.env.R2_PUBLIC_URL}/${path}` : null;

			results.push({
				name: file.name,
				size: file.size,
				type: file.type,
				saved_as: path,
				download_url: downloadUrl,
				signature: sig,
				expiration: exp,
				public_url: publicUrl,
			});
		}

		return jsonSuccess({
			files: results,
		});
	}
}