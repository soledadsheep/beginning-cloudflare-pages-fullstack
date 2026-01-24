import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";

export class UserForgotPassword extends OpenAPIRoute {
	schema = {
		tags: ["User"],
		summary: "Forgot password - send reset email",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							email: z.string().email(),
						}),
					},
				},
			},
		},
		responses: {
			"200": {
				description: "Reset email sent",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string().optional(),
						}),
					},
				},
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { email } = data.body;

		// Check if email exists
		const { results } = await c.env.DB.prepare(
			"SELECT * FROM users WHERE email = ?"
		)
			.bind(email)
			.all();

		if (results.length > 0) {
			// In a real app, send email. Here, just return success.
			return {
				success: true,
				message: "If the email exists, a reset link has been sent.",
			};
		} else {
			// Still return success to prevent email enumeration
			return {
				success: true,
				message: "If the email exists, a reset link has been sent.",
			};
		}
	}
}