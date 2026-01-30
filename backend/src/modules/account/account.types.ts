// backend/src/modules/account/account.types.ts
import { z } from 'zod';

export const PasswordSchema = z
  .string({
    required_error: 'Password is required',
  })
  .min(3, 'Password must be at least 3 characters')
  .max(64, 'Password must be at most 64 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/* ---------- Login ---------- */
export const LoginSchema = z
.object({
	user_name: z.string().min(1, 'Username or email is required'),
	password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/* ---------- Register ---------- */
export const RegisterSchema = z
.object({
	user_name: z.string({
		required_error: 'Username is required',
		invalid_type_error: 'Username must be a string',
	}),
	first_name: z.string(),
	last_name: z.string(),
	full_name: z.string(),
	birth_date: z.string(), // ISO string
	email: z.string().email('Invalid email'),
	password: PasswordSchema,
    confirm_password: z.string(),
	culture_code: z.string(),
})
.superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Passwords do not match',
			code: z.ZodIssueCode.custom,
		});
    }
})
.transform(data => ({
	...data,
	culture_code: data.culture_code ?? 'vi',
}));
export type RegisterInput = z.infer<typeof RegisterSchema>;

/* ---------- Forgot password ---------- */
export const ForgotPasswordSchema = z
.object({
	email: z.string().email('Invalid email'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/* ---------- Reset password ---------- */
export const ResetPasswordSchema = z
.object({
	token: z.string().min(1, 'Token is required'),
    new_password: PasswordSchema,
    confirm_password: z.string(),
})
.superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Passwords do not match',
			code: z.ZodIssueCode.custom,
		});
    }
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/* ---------- Change password ---------- */
export const ChangePasswordSchema = z
.object({
	old_password: z.string().min(1, 'Current password is required'),
    new_password: PasswordSchema,
    confirm_password: z.string(),
})
.superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Passwords do not match',
			code: z.ZodIssueCode.custom,
		});
    }
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/* ---------- Get user ---------- */
export const GetUserSchema = z
.object({
	userId: z.number().optional(),
});
export type GetUserInput = z.infer<typeof GetUserSchema>;


/* ---------- User entity ---------- */
export interface UserEntity {
	id: number;
	user_name: string;
	first_name: string | null;
	last_name: string | null;
	full_name: string | null;
	birth_date: string | null;
	email: string;
	email_confirm: boolean;
	password_hash: string;
	created_on: string;
	updated_on: string;
	culture_code: string;
}

export const UserSchema = z
.object({
	id: z.number(),
	user_name: z.string().min(1),
	first_name: z.string(),
	last_name: z.string(),
	full_name: z.string(),
	birth_date: z.string(),
	email: z.string().email(),
	email_confirm: z.boolean(),
	password_hash: z.string(),
	created_on: z.string(),
	updated_on: z.string(),
	culture_code: z.string(),
	lock_acc_enable: z.boolean(),
	lock_acc_end: z.string().nullable(),
	login_false_count: z.number(),
});
export type UserSchemaType = z.infer<typeof UserSchema>;

