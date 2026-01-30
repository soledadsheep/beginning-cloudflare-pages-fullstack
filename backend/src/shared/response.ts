// /backend/src/shared/response.ts
export function jsonSuccess<T>(data?: T, message = 'OK', status = 200) {
	return new Response(
		JSON.stringify({ success: true, message, data }), { status, headers: { 'Content-Type': 'application/json' } }
	);
}

export function jsonError(message = 'Error', status = 400, errors?: unknown) {
	return new Response(
		JSON.stringify({ success: false, message, errors }), { status, headers: { 'Content-Type': 'application/json' } }
	);
}
