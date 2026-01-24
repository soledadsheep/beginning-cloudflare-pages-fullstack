import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, User } from "../types";

export class UserRegister extends OpenAPIRoute {
	schema = {
		tags: ["User"],
		summary: "Register user",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							user_name: z.string(),
							first_name: z.string(),
							last_name: z.string(),
							full_name: z.string(),
							birth_date: z.string(),
							email: z.string(),
							password: z.string(),
							culture_code: z.string().default("vi"),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Registration successful",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							user: User.optional(),
							message: z.string().optional(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { user_name, first_name, last_name, full_name, birth_date, email, password, culture_code } = data.body;

		// Check if user exists
		const { results } = await c.env.DB.prepare(
			"SELECT * FROM users WHERE user_name = ? OR email = ?"
		)
			.bind(user_name, email)
			.all();

		if (results.length > 0) {
			return {
				success: false,
				message: "User already exists",
			};
		}

		// Hash password
		const passwordHash = await hashPassword(password);

		// Insert user
		const result = await c.env.DB.prepare(
			`INSERT INTO users (user_name, first_name, last_name, full_name, birth_date, email, email_confirm, password_hash, created_on, updated_on, culture_code, lock_acc_enable, lock_acc_end, login_false_count)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
			.bind(user_name, first_name, last_name, full_name, birth_date, email, false, passwordHash, new Date().toISOString(), new Date().toISOString(), culture_code, false, null, 0)
			.run();

		if (result.success) {
			// Get the inserted user
			const { results: userResults } = await c.env.DB.prepare(
				"SELECT * FROM users WHERE id = ?"
			)
				.bind(result.meta.last_row_id)
				.all();

			return {
				success: true,
				user: userResults[0] as any,
			};
		} else {
			return {
				success: false,
				message: "Registration failed",
			};
		}
	}
}

async function hashPassword(password: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}