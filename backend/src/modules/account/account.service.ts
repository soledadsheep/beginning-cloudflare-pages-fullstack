// backend/src/modules/account/account.service.ts
import { verifyPassword, hashPassword } from '../../shared/crypto/password'
import { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, GetUserInput, ChangePasswordInput, ChangePasswordTokenInput } from './account.types';
import { AccountRepository } from './account.repository';
import { sanitizeInput } from '../../shared/sanitize';
import { signToken } from '../../middlewares/auth';
import { randomCode } from '../../shared/utils';
import { record } from 'zod/v4/mini';

export class AccountService {
	constructor(private repo: AccountRepository) {}

	async login(input: LoginInput, secret?: string | null) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.user_name, input.user_name);
		if (!user) return { success: false, message: 'Invalid credentials' };

		const ok = await verifyPassword(input.password, user.password_hash);
		if (!ok) {
			await this.repo.incrementFailCount(input.user_name);
			return { success: false, message: 'Invalid credentials' };
		}
		else {
			await this.repo.resetFailCount(user.id);
		}

		const userPermissions = await this.repo.getUserPermissions(user.id);
		const accessToken = await signToken({
			sub: user.id,
			user_name: user.user_name,
			permissions: userPermissions,
			email: user.email,
		}, secret);

		return {
			success: true,
			user: {
				id: user.id,
				user_name: user.user_name,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				full_name: user.full_name,
        		birth_date: user.birth_date,
				culture_code: user.culture_code,
				permissions: userPermissions,
			},
			access_token: accessToken,
			token_type: 'Bearer'
		};
	}

	async register(input: RegisterInput) {
		input = sanitizeInput(input);
		// Check existing user
		const exists = await this.repo.findByUserNameOrEmail(input.user_name, input.email);
		if (exists) return { success: false, message: 'User already exists' };

		const passwordHash = await hashPassword(input.password);
		const result = await this.repo.createUser(input, passwordHash);
		console.log('Register input:', result);
		if (!result.meta.last_row_id) return { success: false, message: 'Registration failed' };

		const user = await this.repo.findById(result.meta.last_row_id as number);
		if (!user) return { success: false, message: 'Registration failed' };
		return { success: true, user };
	}

	async forgotPassword(input: ForgotPasswordInput) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.email, input.email);
		if (!user) return { success: true };	// luôn trả success để tránh dò user

		const record = await this.repo.findResetToken(user.id);
		if (record && !record.used && new Date(record.expired_at) > new Date()) return { success: true };	// còn token chưa dùng & chưa hết hạn
		
		const code = randomCode(48);
		const tokenHash = await hashPassword(code);
		const expiredAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();	// 30min
		await this.repo.insertResetToken(user.id, tokenHash, expiredAt);

		return {
			success: true,
			tokenHash: tokenHash, // chỉ để test, production ko trả về
			expiredAt: expiredAt, // chỉ để test, production ko trả về
		};
	}

	async changePasswordToken(input: ChangePasswordTokenInput) {
		input = sanitizeInput(input);
		const record = await this.repo.findResetToken(input.token);
		if (!record) return { success: false, message: 'Invalid token' };
		if (new Date(record.expired_at) < new Date()) return { success: false, message: 'Token expired' };

		const passwordHash = await hashPassword(input.new_password);
		await this.repo.updatePassword(record.user_id, passwordHash);
		await this.repo.markResetTokenUsed(record.id);

		return { success: true };
	}

	async resetPassword(input: ResetPasswordInput) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.userid_or_email, input.userid_or_email);
		if (!user) return { success: false, message: 'User not found' };
		const passwordHash = await hashPassword(input.new_password);
		await this.repo.updatePassword(user.id, passwordHash);
		return { success: true };
	}

	async changePassword(input: ChangePasswordInput, jwt: any) {
		input = sanitizeInput(input);
		const userId = jwt.sub;
		const user = await this.repo.findById(userId);
		if (!user) return { success: false, message: 'User not found' };
		const ok = await verifyPassword(input.old_password, user.password_hash);
		if (!ok) return { success: false, message: 'Old password is incorrect' };
		const newPasswordHash = await hashPassword(input.new_password);
		await this.repo.updatePassword(userId, newPasswordHash);
		return { success: true, message: 'Password changed successfully' };
	}

	async getCurrentUser(jwt: any) {
		const user = await this.repo.findById(jwt.sub);
		if (!user) return { success: false, message: 'User not found' };
		return { success: true, user };
	}

	async getUser(input: GetUserInput) {
		input = sanitizeInput(input);
		const user = await this.repo.getUser(input.userId);
		if (!user) return { success: false, message: 'User not found' };
		return { success: true, user };
	}
}
