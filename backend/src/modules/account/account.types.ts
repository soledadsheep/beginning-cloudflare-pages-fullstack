// backend/src/modules/account/account.types.ts
import { z } from 'zod';

export const PasswordSchema = z
  .string({
    required_error: 'Hãy nhập mật khẩu',
  })
  .min(3, 'Mật khẩu phải có ít nhất 3 ký tự')
  .max(64, 'Mật khẩu không được quá 64 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ cái viết thường')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt')
  .describe('Nhập mật khẩu');

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
		required_error: 'Hãy nhập username'
	}),
	first_name: z.string(),
	last_name: z.string(),
	full_name: z.string(),
	birth_date: z.string(), // ISO string
	email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
	password: PasswordSchema,
    confirm_password: z.string(),
	culture_code: z.string(),
})
.superRefine((data, ctx) => {
    if (data.password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Xác nhận mật khẩu không khớp',
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
	email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/* ---------- Change password token ---------- */
export const ChangePasswordTokenSchema = z
.object({
	token: z.string().min(1, 'Token là bắt buộc'),
    new_password: PasswordSchema,
    confirm_password: z.string(),
})
.superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Xác nhận mật khẩu không khớp',
			code: z.ZodIssueCode.custom,
		});
    }
});
export type ChangePasswordTokenInput = z.infer<typeof ChangePasswordTokenSchema>;

/* ---------- Reset password ---------- */
export const ResetPasswordSchema = z
.object({
	userid_or_email: z.string().min(1, 'Hãy nhập email hoặc username'),
    new_password: PasswordSchema,
    confirm_password: z.string(),
})
.superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Xác nhận mật khẩu không khớp',
			code: z.ZodIssueCode.custom,
		});
    }
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;


/* ---------- Change password ---------- */
export const ChangePasswordSchema = z
.object({
	old_password: z.string().min(1, 'Hãy nhập mật khẩu hiện tại').describe('Nhập mật khẩu hiện tại'),
    new_password: PasswordSchema,
    confirm_password: z.string().describe('Nhập lại mật khẩu mới'),
})
.superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
		ctx.addIssue({
			path: ['confirm_password'],
			message: 'Xác nhận mật khẩu không khớp',
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
	lock_acc_enable: boolean;
	lock_acc_end: string | null;
	login_false_count: number;
	token_version: number;
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
	token_version: z.number(),
});
export type UserSchemaType = z.infer<typeof UserSchema>;

