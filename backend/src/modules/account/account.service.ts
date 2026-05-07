// backend/src/modules/account/account.service.ts
import { verifyPassword, hashPassword } from '../../shared/crypto/password'
import { LoginInput, RegisterUserInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput, ChangePasswordTokenInput, CreateOrUpdateUserInput, ListUsersInput } from './account.types';
import { AccountRepository } from './account.repository';
import { sanitizeInput } from '../../shared/sanitize';
import { signToken } from '../../middlewares/auth';
import { jsonSuccess } from '../../shared/response'
import { MailService } from '../mail/mail.service';
import type { Env } from '../../env';

export class AccountService {
	constructor(private repo: AccountRepository, private mailService: MailService, private env: Env) { }

	async login(input: LoginInput, secret?: string | null) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.user_name, input.user_name);
		if (!user) return { success: false, message: 'Invalid credentials' };

		// Kiểm tra email đã xác nhận chưa
		if (user.email_confirm === false) {
			return { success: false, message: 'Email not confirmed' };
		}

		// Kiểm tra tài khoản có bị khóa không
		if (user.is_locked && user.lock_until && new Date(user.lock_until) > new Date()) {
			const remainingSeconds = Math.ceil((new Date(user.lock_until).getTime() - Date.now()) / 1000);
			const remainingMinutes = Math.ceil(remainingSeconds / 60);
			return {
				success: false,
				message: `Your account has been locked. Please try again in ${remainingMinutes} minute(s).`
			};
		}

		// Xác thực mật khẩu
		const ok = await verifyPassword(input.password, user.password_hash);
		if (!ok) {
			await this.repo.updateUser(user.id, { login_fail_count: user.login_fail_count + 1 });
			const maxAttempts = 5;
			const remainingAttempts = maxAttempts - user.login_fail_count - 1;

			if (remainingAttempts <= 0) {
				// Khóa tài khoản
				const lockoutMinutes = 5; // Khóa trong 5 phút
				await this.repo.updateUser(user.id, { is_locked: true, lock_until: new Date(Date.now() + lockoutMinutes * 60 * 1000).toISOString() });
				return {
					success: false,
					message: `Your account has been locked for ${lockoutMinutes} minute(s) due to too many failed attempts.`
				};
			}
			else {
				// Thông báo số lần thử còn lại
				const message = remainingAttempts < 3
					? `Invalid login credentials. You have ${remainingAttempts} attempt(s) remaining before your account is locked.`
					: 'Invalid login credentials. Please try again.';
				return { success: false, message };
			}
		}

		// Đăng nhập thành công, reset login fail count, unlock account nếu đang bị khóa
		await this.repo.updateUser(user.id, { login_fail_count: 0, is_locked: false, lock_until: null, last_login_time: new Date().toISOString() });

		// Trả về accessToken
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

		// Gửi email xác nhận đăng ký
		await this.mailService.queueMail({
			to: user.email,
			subject: 'Xác nhận đăng ký',
			html: `<p>Xin chào ${user.full_name || user.user_name},</p><p>Cảm ơn bạn đã đăng ký tài khoản.</p>`
		});

		return jsonSuccess({ user });
	}

	async forgotPassword(input: ForgotPasswordInput) {
		input = sanitizeInput(input);
		const user = await this.repo.findByUserNameOrEmail(input.email, input.email);
		if (!user) return jsonSuccess();
		await this.repo.deleteResetTokensExpired();
		const record = await this.repo.findResetToken(user.id);
		if (record) return jsonSuccess();	// vẫn còn token chưa dùng & chưa hết hạn
		// Tạo token mới và lưu vào DB
		const code = crypto.randomUUID();
		const tokenHash = await hashPassword(code);
		const expiredAt = new Date(Date.now() + 1000 * 60 * 30).toISOString();	// 30min
		await this.repo.insertResetToken(user.id, tokenHash, expiredAt);
		// Gửi email chứa link reset password
		const resetLink = `${this.env.FRONTEND_URL}/change-password-token?token=${encodeURIComponent(tokenHash)}`;
		await this.mailService.queueMail({
			to: user.email,
			subject: 'Yêu cầu đặt lại mật khẩu',
			html: `
				<h2>Xin chào ${user.full_name || user.user_name},</h2>
                <p>Bạn vừa yêu cầu đặt lại mật khẩu. Nhấn vào liên kết dưới đây để tiến hành (có hiệu lực 30 phút):</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
                <br/>
                <p>Trân trọng,<br/>Đội ngũ hỗ trợ</p>
			`,
			text: `Đặt lại mật khẩu: ${resetLink}`,
		});
		return jsonSuccess();
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
		await this.repo.deleteResetToken(record.id);
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

		let newPassword: string;
		if (input.new_password) newPassword = input.new_password;
		else newPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12);

		const passwordHash = await hashPassword(newPassword);
		await this.repo.updatePasswordWithHistory(user.id, passwordHash, user.password_hash);
		await this.mailService.queueMail({
			to: user.email,
			subject: 'Your password has been reset',
			text: `Hello ${user.user_name},\n\nYour new password is: ${newPassword}\n\nPlease change it after logging in.\n\nBest regards,`,
			html: `<p>Hello ${user.user_name},</p><p>Your new password is: <strong>${newPassword}</strong></p><p>Please change it after logging in.</p><p>Best regards,</p>`,
		});
		return jsonSuccess({ success: true, message: `Password has been reset for user ${user.user_name}.` });
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