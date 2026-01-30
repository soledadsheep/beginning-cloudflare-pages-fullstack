// backend/src/modules/account/handlers/resetPassword.ts
import { parseBody } from '../../../shared/validator';
import { jsonError, jsonSuccess } from '../../../shared/response'
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { AppContext } from '../../../types';
import { RegisterSchema } from '../account.types';

export async function registerHandler(c: AppContext): Promise<Response> {
	try {
		const input = await parseBody(c.req, RegisterSchema);
		const service = new AccountService(new AccountRepository(c.env));
		const result = await service.register(input);
		return jsonSuccess(result);
	} catch (e: any) {
		return jsonError(e.message ?? 'Invalid request');
	}
}
