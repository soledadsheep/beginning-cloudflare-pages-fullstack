// backend/src/modules/account/handlers/resetPassword.ts
import { parseBody } from '../../../shared/validator';
import { jsonError, jsonSuccess } from '../../../shared/response'
import { AccountRepository } from '../account.repository';
import { AccountService } from '../account.service';
import { AppContext } from '../../../types';
import { ForgotPasswordSchema } from '../account.types';

export async function forgotPasswordHandler(c: AppContext): Promise<Response> {
	try {
		const input = await parseBody(c.req, ForgotPasswordSchema);
		const service = new AccountService(new AccountRepository(c.env));
		const result = await service.forgotPassword(input);
		return jsonSuccess(result);
	} catch (e: any) {
		return jsonError(e.message ?? 'Invalid request');
	}
}
