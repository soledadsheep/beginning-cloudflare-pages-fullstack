// backend/src/modules/account/handlers/userLogin.ts
import { parseBody } from '../../../shared/validator';
import { jsonError, jsonSuccess } from '../../../shared/response'
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { AppContext } from '../../../types';
import { LoginSchema } from '../account.types';

export async function loginHandler(c: AppContext): Promise<Response> {
	try {
		const input = await parseBody(c.req, LoginSchema);
		const service = new AccountService(new AccountRepository(c.env));
		const result = await service.login(input);
		if (!result.success) return c.json({ success: false, message: result.message }, 200);
		return c.json({ success: true, user: result.user }, 200);
	} catch (e: any) {
		return jsonError(e.message ?? 'Invalid request');
	}
}
