// shared/sanitize.ts
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput<T extends Record<string, any>>(input: T): T {
	const out: any = {};
	for (const k in input) {
		const v = input[k];
		out[k] =
			typeof v === 'string'
				? sanitizeHtml(v, { allowedTags: [], allowedAttributes: {} })
				: v;
	}
	return out;
}
