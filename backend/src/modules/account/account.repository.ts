// backend/src/modules/account/account.repository.ts
import type { Env } from '../../env';
import { getDb } from '../../shared/db/d1'
import type { UserEntity, CreateOrUpdateUserInput, RegisterUserInput, ListUsersInput } from './account.types';

export class AccountRepository {
	constructor(private env: Env) {}

	async findByUserNameOrEmail(user_name: string, email: string): Promise<UserEntity | null> {
		return await getDb(this.env)
			.prepare(`SELECT * FROM users WHERE user_name = ? OR email = ?`)
			.bind(user_name, email)
			.first<UserEntity>();
	}

	async getUserById(userId: number): Promise<UserEntity | null> {
		return await getDb(this.env)
			.prepare(`SELECT * FROM users WHERE id = ?`)
			.bind(userId)
			.first<UserEntity>();
	}

	async resetLoginFailCount(userId: number) {
		return await getDb(this.env)
			.prepare(`UPDATE users SET login_false_count = 0 WHERE id = ?`)
			.bind(userId)
			.run();
	}

	async incrementLoginFailCount(user_name: string) {
		return await getDb(this.env)
			.prepare(
				`UPDATE users
				 SET login_false_count = login_false_count + 1
				 WHERE user_name = ?`
			)
			.bind(user_name)
			.run();
	}

	async registerUser(data: RegisterUserInput, password_hash: string): Promise<D1Result> {
		return await getDb(this.env)
			.prepare(`
				INSERT INTO users
				(user_name, first_name, last_name, full_name,
				birth_date, phone, address1, address2, email, email_confirm,
				password_hash, created_on, updated_on,
				country_code, lock_acc_enable, lock_acc_end, login_false_count)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`)
			.bind(
				data.user_name,
				data.first_name,
				data.last_name,
				data.full_name,
				data.birth_date,
				data.phone,
				data.address1,
				data.address2,
				data.email,
				0, // email_confirm = false
				password_hash,
				new Date().toISOString(),
				new Date().toISOString(),
				data.country_code,
				0, // lock_acc_enable = false
				null, // lock_acc_end
				0  // login_false_count
			)
			.run();
	}

	async createUser(input: CreateOrUpdateUserInput, password_hash: string): Promise<D1Result> {
		return await getDb(this.env)
			.prepare(
				`INSERT INTO users
				(user_name, first_name, last_name, full_name,
				 birth_date, phone, address1, address2, email, email_confirm,
				 password_hash, created_on, updated_on,
				 country_code, lock_acc_enable, lock_acc_end,
				 login_false_count)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				input.user_name,
				input.first_name,
				input.last_name,
				input.full_name,
				input.birth_date,
				input.phone,
				input.address1,
				input.address2,
				input.email,
				false,
				password_hash,
				new Date().toISOString(),
				new Date().toISOString(),
				input.country_code ?? 'vi',
				false,
				null,
				0
			)
			.run();
	}

	async updateUser(userId: number, input: Partial<CreateOrUpdateUserInput>) {
		const fields = [];
		const values = [];

		if (input.first_name !== undefined) {
			fields.push('first_name = ?');
			values.push(input.first_name);
		}
		if (input.last_name !== undefined) {
			fields.push('last_name = ?');
			values.push(input.last_name);
		}
		if (input.full_name !== undefined) {
			fields.push('full_name = ?');
			values.push(input.full_name);
		}
		if (input.birth_date !== undefined) {
			fields.push('birth_date = ?');
			values.push(input.birth_date);
		}
		if (input.phone !== undefined) {
			fields.push('phone = ?');
			values.push(input.phone);
		}
		if (input.address1 !== undefined) {
			fields.push('address1 = ?');
			values.push(input.address1);
		}
		if (input.address2 !== undefined) {
			fields.push('address2 = ?');
			values.push(input.address2);
		}
		if (input.country_code !== undefined) {
			fields.push('country_code = ?');
			values.push(input.country_code);
		}

		if (input.lock_acc_enable !== undefined) {
			fields.push('lock_acc_enable = ?');
			values.push(input.lock_acc_enable ? 1 : 0);
		}

		if (input.lock_false_count !== undefined) {
			fields.push('login_false_count = ?');
			values.push(input.lock_false_count);
		}

		if (fields.length === 0) {
			return Promise.resolve({ success: true });
		}

		values.push(userId);
		const sql = `UPDATE users SET ${fields.join(', ')}, updated_on = datetime('now') WHERE id = ?`;
		return await getDb(this.env)
			.prepare(sql)
			.bind(...values)
			.run();
	}

	async updateEmailConfirm(userId: number, email_confirm: boolean) {
		return await getDb(this.env)
			.prepare(`UPDATE users SET email_confirm = ?, updated_on = datetime('now') WHERE id = ?`)
			.bind(email_confirm ? 1 : 0, userId)
			.run();
	}

	async insertResetToken(userId: number, token: string, expiredAt: string) {
		return await getDb(this.env)
			.prepare(
				`INSERT INTO user_password_resets
				(user_id, token, expired_at, used, created_on)
				VALUES (?, ?, ?, 0, datetime('now'))`
			)
			.bind(userId, token, expiredAt)
			.run();
	}

	async findResetToken(tokenOrUserId: string | number) {
		const isUserId = typeof tokenOrUserId === 'number' || (typeof tokenOrUserId === 'string' && /^\d+$/.test(tokenOrUserId));
		if (isUserId) {
			return await getDb(this.env)
				.prepare(`SELECT * FROM user_password_resets WHERE user_id = ? AND used = 0 ORDER BY created_on DESC LIMIT 1`)
				.bind(tokenOrUserId)
				.first<any>();
		}

		return await getDb(this.env)
			.prepare(`SELECT * FROM user_password_resets WHERE token = ? AND used = 0 LIMIT 1`)
			.bind(tokenOrUserId)
			.first<any>();
	}

	async markResetTokenUsed(id: number) {
		return await getDb(this.env)
			.prepare(`UPDATE user_password_resets SET used = 1 WHERE id = ?`)
			.bind(id)
			.run();
	}

	async incrementTokenVersion(userId: number) {
		return await getDb(this.env)
			.prepare(`UPDATE users SET token_version = token_version + 1 WHERE id = ?`)
			.bind(userId)
			.run();
	}

	async updatePasswordWithHistory(userId: number, newPasswordHash: string, oldPasswordHash: string, maxHistory: number = 10): Promise<D1Result> {
		// Lấy password_his hiện tại
		const user = await this.getUserById(userId);
		if (!user) throw new Error('User not found');
		
		let history: string[] = [];
		if (user.password_his) {
			try {
				history = JSON.parse(user.password_his);
				if (!Array.isArray(history)) history = [];
			} catch(e) {
				history = [];
			}
		}
		
		// Thêm hash cũ vào đầu mảng
		history.unshift(oldPasswordHash);
		
		// Giới hạn số lượng bản ghi lưu trữ
		if (history.length > maxHistory) {
			history = history.slice(0, maxHistory);
		}
		
		const newHistoryJson = JSON.stringify(history);
		
		return await getDb(this.env)
			.prepare(`
				UPDATE users 
				SET password_hash = ?, 
					password_his = ?, 
					updated_on = datetime('now'), 
					token_version = token_version + 1 
				WHERE id = ?
			`)
			.bind(newPasswordHash, newHistoryJson, userId)
			.run();
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

	async getUsers(limit: number, offset: number, filters: Omit<ListUsersInput, 'page' | 'limit'>): Promise<UserEntity[]> {
		const { whereClause, params } = this._buildUserFilters(filters);
		const sortColumn = filters.sort_by || 'id';
		const sortDir = filters.sort_order === 'asc' ? 'ASC' : 'DESC';

		const sql = `
			SELECT id, user_name, first_name, last_name, full_name,
				birth_date, phone, address1, address2, email, email_confirm,
				country_code, created_on, updated_on, is_deleted
			FROM users
			${whereClause}
			ORDER BY ${sortColumn} ${sortDir}
			LIMIT ? OFFSET ?
		`;
		params.push(limit, offset);
		const result = await getDb(this.env).prepare(sql).bind(...params).all<UserEntity>();
		return result.results;
	}

	async countUsers(filters: Omit<ListUsersInput, 'page' | 'limit'>): Promise<number> {
		const { whereClause, params } = this._buildUserFilters(filters);
		const sql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
		const result = await getDb(this.env).prepare(sql).bind(...params).first<{ total: number }>();
		return result?.total ?? 0;
	}

	async deleteUser(userId: number) {
		return await getDb(this.env)
			.prepare(`DELETE FROM users WHERE id = ?`)
			.bind(userId)
			.run();
	}


	// Helper xây dựng conditions và params
	private _buildUserFilters(filters: Omit<ListUsersInput, 'page' | 'limit'>): { whereClause: string; params: any[] } {
		const conditions: string[] = [];
		const params: any[] = [];

		const addCondition = (sql: string, value: any) => {
			if (value !== undefined && value !== null && value !== '') {
				conditions.push(sql);
				params.push(value);
			}
		};

		// Filter chính xác từng trường
		addCondition('user_name = ?', filters.user_name);
		addCondition('email = ?', filters.email);
		addCondition('full_name LIKE ?', filters.full_name ? `%${filters.full_name}%` : undefined);
		addCondition('first_name LIKE ?', filters.first_name ? `%${filters.first_name}%` : undefined);
		addCondition('last_name LIKE ?', filters.last_name ? `%${filters.last_name}%` : undefined);
		addCondition('phone = ?', filters.phone);
		addCondition('country_code = ?', filters.country_code);
		addCondition('email_confirm = ?', filters.email_confirm === undefined ? undefined : (filters.email_confirm ? 1 : 0));
		addCondition('is_deleted = ?', filters.is_deleted === undefined ? undefined : (filters.is_deleted ? 1 : 0));

		// Khoảng ngày sinh
		if (filters.birth_date_from) {
			conditions.push('birth_date >= ?');
			params.push(filters.birth_date_from);
		}
		if (filters.birth_date_to) {
			conditions.push('birth_date <= ?');
			params.push(filters.birth_date_to);
		}

		// Khoảng thời gian tạo
		if (filters.created_from) {
			conditions.push('created_on >= ?');
			params.push(filters.created_from);
		}
		if (filters.created_to) {
			conditions.push('created_on <= ?');
			params.push(filters.created_to);
		}

		// Tìm kiếm chung (user_name, email, full_name)
		if (filters.search) {
			conditions.push(`(user_name LIKE ? OR email LIKE ? OR full_name LIKE ?)`);
			const like = `%${filters.search}%`;
			params.push(like, like, like);
		}

		const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
		return { whereClause, params };
	}

}
