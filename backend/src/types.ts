import { DateTime, Email, Str } from "chanfana";
import type { Context } from "hono";
import { z } from "zod";

export interface Env {
	DB: D1Database;
}

export type AppContext = Context<{ Bindings: Env }>;

export const User = z.object({
	id: z.number(),
	user_name: Str(),
	first_name: Str(),
	last_name: Str(),
	full_name: Str(),
	birth_date: DateTime(),
	email: Email(),
	email_confirm: z.boolean(),
	password_hash: Str(),
	created_on: DateTime(),
	updated_on: DateTime(),
	culture_code: Str(),
	lock_acc_enable: z.boolean(),
	lock_acc_end: DateTime().nullable(),
	login_false_count: z.number(),
});

export type UserType = z.infer<typeof User>;