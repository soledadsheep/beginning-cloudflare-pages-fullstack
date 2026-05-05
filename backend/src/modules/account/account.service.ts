// backend/src/modules/account/account.service.ts
import { verifyPassword, hashPassword } from '../../shared/crypto/password'
import { LoginInput, RegisterUserInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput, ChangePasswordTokenInput, CreateOrUpdateUserInput, ListUsersInput } from './account.types';
import { AccountRepository } from './account.repository';
import { sanitizeInput } from '../../shared/sanitize';
import { signToken } from '../../middlewares/auth';
import { jsonSuccess } from '../../shared/response'

export class AccountService {
	constructor(private repo: AccountRepository) {}

	async login(input: LoginInput, secret?: string | null) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.user_name, input.user_name);
		if (!user) return { success: false, message: 'Invalid credentials' };

		const ok = await verifyPassword(input.password, user.password_hash);
		if (!ok) {
			await this.repo.incrementLoginFailCount(input.user_name);
			return { success: false, message: 'Invalid credentials' };
		}
		else await this.repo.resetLoginFailCount(user.id);

		const userPermissions = await this.repo.getUserPermissions(user.id);
		const accessToken = await signToken({
			sub: user.id,
			user_name: user.user_name,
			email: user.email,
			country_code: user.country_code,
			permissions: userPermissions,
			ver: user.token_version,
		}, secret);

		return jsonSuccess({
			user: {
				id: user.id,
				user_name: user.user_name,
				email: user.email,
				first_name: user.first_name,
				last_name: user.last_name,
				full_name: user.full_name,
        		birth_date: user.birth_date,
				country_code: user.country_code,
				permissions: userPermissions,
			},
			access_token: accessToken,
			token_type: 'Bearer',
			token_version: user.token_version,
		});
	}

	async logout(userId: number) {
		await this.repo.incrementTokenVersion(userId);
		return { success: true, message: 'Logged out successfully' };
	}

	async register(input: RegisterUserInput) {
		input = sanitizeInput(input);
		const exists = await this.repo.findByUserNameOrEmail(input.user_name, input.email);
		if (exists) return { success: false, message: 'User already exists' };

		const passwordHash = await hashPassword(input.password);
		const result = await this.repo.registerUser(input, passwordHash);
		if (!result.meta.last_row_id) return { success: false, message: 'Registration failed' };

		const user = await this.repo.getUserById(result.meta.last_row_id as number);
		if (!user) return { success: false, message: 'Registration failed' };
		return jsonSuccess({ user });
	}

	async forgotPassword(input: ForgotPasswordInput) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.email, input.email);
		if (!user) return jsonSuccess();
		const record = await this.repo.findResetToken(user.id);
		if (record && new Date(record.expired_at) > new Date()) return jsonSuccess({ tokenHash: record.token, expiredAt: record.expired_at });	// còn token chưa dùng & chưa hết hạn
		
		const code = crypto.randomUUID();
		const tokenHash = await hashPassword(code);
		const expiredAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();	// 30min
		await this.repo.insertResetToken(user.id, tokenHash, expiredAt);
		return jsonSuccess({ tokenHash: tokenHash, expiredAt: expiredAt });
	}

	async changePasswordToken(input: ChangePasswordTokenInput) {
		const record = await this.repo.findResetToken(input.token);
		if (!record || new Date(record.expired_at) < new Date()) return jsonSuccess({ success: false, message: 'Invalid or expired token' });
		const passwordHash = await hashPassword(input.new_password);
		// Lấy user để có password_hash cũ
		const user = await this.repo.getUserById(record.user_id);
		if (!user) return jsonSuccess({ success: false, message: 'User not found' });
		// Cập nhật mật khẩu và lưu lịch sử mật khẩu
    	await this.repo.updatePasswordWithHistory(record.user_id, passwordHash, user.password_hash);
		await this.repo.markResetTokenUsed(record.id);
		return jsonSuccess({ success: true, message: 'Password reset successfully' });
	}

	async changePassword(input: ChangePasswordInput, jwt: any) {
		input = sanitizeInput(input);
		const userId = jwt.sub;
		const user = await this.repo.getUserById(userId);
		if (!user) return jsonSuccess({ success: false, message: 'User not found' });
		const ok = await verifyPassword(input.old_password, user.password_hash);
		if (!ok) return jsonSuccess({ success: false, message: 'Old password is incorrect' });
		const newPasswordHash = await hashPassword(input.new_password);
		// Cập nhật mật khẩu và lưu lịch sử mật khẩu
    	await this.repo.updatePasswordWithHistory(userId, newPasswordHash, user.password_hash);
		return jsonSuccess({ success: true, message: 'Password changed successfully' });
	}

	async getCurrentUser(jwt: any) {
		const user = await this.repo.getUserById(jwt.sub);
		if (!user) return jsonSuccess({ success: false, message: 'User not found' });
		return jsonSuccess({ user });
	}

	async updateProfile(userId: number, input: Partial<CreateOrUpdateUserInput>) {
		input = sanitizeInput(input);
		await this.repo.updateUser(userId, input);
		return jsonSuccess({ success: true, message: 'Profile updated successfully' });
	}

	async updateEmailConfirm(userId: number, email_confirm: boolean) {
		await this.repo.updateEmailConfirm(userId, email_confirm);
		return jsonSuccess({ success: true, message: 'Email confirmation status updated successfully' });
	}

	// Admin management

	async resetPassword(input: ResetPasswordInput) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.userid_or_email, input.userid_or_email);
		if (!user) return jsonSuccess({ success: false, message: 'User not found' });
		const passwordHash = await hashPassword(input.new_password);
		await this.repo.updatePasswordWithHistory(user.id, passwordHash, user.password_hash);
		return jsonSuccess({ success: true, message: 'Password reset successfully' });
	}

	async listUsers(query: ListUsersInput) {
		const { page, limit, ...filters } = query;
		const offset = (page - 1) * limit;
		const users = await this.repo.getUsers(limit, offset, filters);
		const total = await this.repo.countUsers(filters);
		return jsonSuccess({
			data: users,
			pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
			},
		});
	}

	async getUserById(userId: number) {
		const user = await this.repo.getUserById(userId);
		if (!user) return jsonSuccess({ success: false, message: 'User not found' });
		const { password_hash, ...safeUser } = user;
		return jsonSuccess({ user: safeUser });
	}

	async createUser(input: CreateOrUpdateUserInput) {
		// Kiểm tra username/email đã tồn tại
		const existing = await this.repo.findByUserNameOrEmail(input.user_name, input.email);
		if (existing) return jsonSuccess({ success: false, message: 'Username or email already exists' });
		
		const passwordHash = await hashPassword(input.password);
		const result = await this.repo.createUser(input, passwordHash);
		if (!result.success) return jsonSuccess({ success: false, message: 'Failed to create user' });
		
		// Lấy user vừa tạo (cần thêm method findLastCreated hoặc dùng lastInsertRowid)
		const newUser = await this.repo.getUserById(result.meta.last_row_id);
		const { password_hash: _, ...safeUser } = newUser!;
		return jsonSuccess({ user: safeUser });
	}

	async updateUser(userId: number, input: CreateOrUpdateUserInput, jwt: any) {
		// Kiểm tra quyền: chỉ admin hoặc chính user đó
		const currentUser = await this.repo.getUserById(userId);
		if (!currentUser) return jsonSuccess({ success: false, message: 'User not found' });
		
		const isAdmin = jwt.permissions?.includes('user:update') || false;
		const isOwner = jwt.sub === userId;
		if (!isAdmin && !isOwner) {
			return jsonSuccess({ success: false, message: 'Forbidden' });
		}
		
		await this.repo.updateUser(userId, input);
		return jsonSuccess({ success: true, message: 'User updated successfully' });
	}

	async deleteUser(userId: number) {
		await this.repo.updateEmailConfirm(userId, false);
		return jsonSuccess({ success: true, message: 'User deleted successfully' });
	}

}