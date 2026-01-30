// backend/src/modules/account/account.repository.ts
import type { Env } from '../../env';
import { getDb } from '../../shared/db/d1'
import type { UserEntity, RegisterInput } from './account.types';

export class AccountRepository {
	constructor(private env: Env) {}

	findByUserNameOrEmail(user_name: string, email: string): Promise<UserEntity | null> {
		return getDb(this.env)
			.prepare(`SELECT * FROM users WHERE user_name = ? OR email = ?`)
			.bind(user_name, email)
			.first<UserEntity>();
	}

	findById(id: number): Promise<UserEntity | null> {
		return getDb(this.env)
			.prepare(`SELECT * FROM users WHERE id = ?`)
			.bind(id)
			.first<UserEntity>();
	}

	resetFailCount(userId: number) {
		return getDb(this.env)
			.prepare(`UPDATE users SET login_false_count = 0 WHERE id = ?`)
			.bind(userId)
			.run();
	}

	incrementFailCount(user_name: string) {
		return getDb(this.env)
			.prepare(
				`UPDATE users
				 SET login_false_count = login_false_count + 1
				 WHERE user_name = ?`
			)
			.bind(user_name)
			.run();
	}

	createUser(input: RegisterInput, password_hash: string): Promise<D1Result> {
		return getDb(this.env)
			.prepare(
				`INSERT INTO users
				(user_name, first_name, last_name, full_name,
				 birth_date, email, email_confirm,
				 password_hash, created_on, updated_on,
				 culture_code, lock_acc_enable, lock_acc_end,
				 login_false_count)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				input.user_name,
				input.first_name,
				input.last_name,
				input.full_name,
				input.birth_date,
				input.email,
				false,
				password_hash,
				new Date().toISOString(),
				new Date().toISOString(),
				input.culture_code ?? 'vi',
				false,
				null,
				0
			)
			.run();
	}

	insertResetToken(userId: number, token: string, expiredAt: string) {
		return getDb(this.env)
			.prepare(
				`INSERT INTO user_password_resets
				(user_id, token, expired_at, used, created_on)
				VALUES (?, ?, ?, 0, datetime('now'))`
			)
			.bind(userId, token, expiredAt)
			.run();
	}

	findResetToken(token: string) {
		return getDb(this.env)
			.prepare(`SELECT * FROM user_password_resets WHERE token = ?`)
			.bind(token)
			.first<any>();
	}

	markResetTokenUsed(id: number) {
		return getDb(this.env)
			.prepare(`UPDATE user_password_resets SET used = 1 WHERE id = ?`)
			.bind(id)
			.run();
	}

	updatePassword(userId: number, passwordHash: string) {
		return getDb(this.env)
			.prepare(`UPDATE users SET password_hash = ?, updated_on = datetime('now') WHERE id = ?`)
			.bind(passwordHash, userId)
			.run();
	}

	getUser(id?: number | null): Promise<UserEntity | UserEntity[] | null> {
		if (id) {
			return getDb(this.env)
				.prepare(`SELECT * FROM users WHERE id = ?`)
				.bind(id)
				.first<UserEntity>();
		}

		return getDb(this.env)
			.prepare(`SELECT * FROM users`)
			.all<UserEntity>()
			.then(r => r.results);
	}
	
	async getUserPermissions(userId: number): Promise<string[]> {
		const rows = await getDb(this.env)
			.prepare(
				`SELECT p.name
				 FROM user_roles ur
				 JOIN roles r ON ur.role_id = r.id
				 JOIN role_permissions rp ON r.id = rp.role_id
				 JOIN permissions p ON rp.permission_id = p.id
				 WHERE ur.user_id = ?`
			)
			.bind(userId)
			.all<{ name: string }>();
		return rows.results.map(r => r.name);
	}

}
