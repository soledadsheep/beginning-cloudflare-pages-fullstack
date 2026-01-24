import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext, User } from "../types";

export class UserLogin extends OpenAPIRoute {
	schema = {
		tags: ["User"],
		summary: "Login user",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							user_name: z.string(),
							password: z.string(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Login successful",
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
		const { user_name, password } = data.body;

		// Hash the password
		const passwordHash = await hashPassword(password);

		// Query the database
		const { results } = await c.env.DB.prepare(
			"SELECT * FROM users WHERE user_name = ? AND password_hash = ?"
		)
			.bind(user_name, passwordHash)
			.all();

		if (results.length > 0) {
			const user = results[0] as any;
			// Update login_false_count to 0
			await c.env.DB.prepare(
				"UPDATE users SET login_false_count = 0 WHERE id = ?"
			).bind(user.id).run();
			return {
				success: true,
				user: user,
			};
		} else {
			// Increment login_false_count
			await c.env.DB.prepare(
				"UPDATE users SET login_false_count = login_false_count + 1 WHERE user_name = ?"
			).bind(user_name).run();
			return {
				success: false,
				message: "Invalid credentials",
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