// backend/src/modules/account/account.types.ts
import { z } from 'zod';

export const PasswordSchema = z
  .string({
    required_error: 'Hãy nhập mật khẩu',
  })
  .min(3, 'Mật khẩu phải có ít nhất 3 ký tự')
  .max(32, 'Mật khẩu không được vượt quá 32 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa')
  .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất một chữ cái viết thường')
  .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một chữ số')
  .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt')
  .describe('Nhập mật khẩu');


/* ---------- Login ---------- */
export const LoginSchema = z.object({
  user_name: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});
export type LoginInput = z.infer<typeof LoginSchema>;


/* ---------- Register ---------- */
export const RegisterBaseSchema = z.object({
  user_name: z.string({ required_error: 'Hãy nhập username' }).min(3, 'Username tối thiểu 3 ký tự').max(30, 'Username tối đa 30 ký tự').regex(/^[a-zA-Z0-9_]+$/, 'Username chỉ được chứa chữ cái, số và dấu gạch dưới'),
  first_name: z.string().min(1, 'Tên là bắt buộc'),
  last_name: z.string().min(1, 'Họ là bắt buộc'),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải đúng định dạng YYYY-MM-DD').refine((date) => !isNaN(Date.parse(date)) || new Date(date) < new Date(), 'Ngày sinh không hợp lệ'),
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
  phone: z.string().regex(/^\+?[0-9]{7,15}$/, 'Số điện thoại không hợp lệ').optional().nullable(),
  address1: z.string().max(255, 'Địa chỉ không được quá 255 ký tự').optional().nullable(),
  address2: z.string().max(255, 'Địa chỉ không được quá 255 ký tự').optional().nullable(),
  password: PasswordSchema,
  confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  country_code: z.string().optional().refine((val) => !val || ['vi', 'en', 'ja', 'ko'].includes(val), { message: 'Mã quốc gia không hợp lệ' }),
});
export const RegisterSchema = RegisterBaseSchema.strict()
.superRefine((data, ctx) => {
  if (data.password !== data.confirm_password) {
    ctx.addIssue({
      path: ['confirm_password'],
      message: 'Xác nhận mật khẩu không khớp',
      code: z.ZodIssueCode.custom,
    });
  }
})
.transform((data) => ({
  ...data,
  full_name: `${data.first_name} ${data.last_name}`.trim(), // tự động tạo full_name
  country_code: data.country_code ?? 'vi',
}));
export type RegisterUserInput = z.infer<typeof RegisterSchema>;


/* ---------- Forgot password ---------- */
export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ').min(1, 'Email là bắt buộc'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;


/* ---------- Change password token ---------- */
export const ChangePasswordTokenSchema = z.object({
  token: z.string().min(1, 'Token là bắt buộc'),
  new_password: PasswordSchema,
  confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
})
.strict()
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
export const ResetPasswordSchema = z.object({
  userid_or_email: z.string().min(1, 'Hãy nhập email hoặc username'),
  new_password: PasswordSchema,
  confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
})
.strict()
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
export const ChangePasswordSchema = z.object({
  old_password: z.string().min(1, 'Hãy nhập mật khẩu hiện tại').describe('Nhập mật khẩu hiện tại'),
  new_password: PasswordSchema,
  confirm_password: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc').describe('Nhập lại mật khẩu mới'),
})
.strict()
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


/* ---------- User entity ---------- */
export interface UserEntity {
  id: number;
  user_name: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  birth_date: string | null;
  phone: string | null;
  address1: string | null;
  address2: string | null;
  email: string;
  email_confirm: boolean;
  password_hash: string;
  password_his: string;
  created_on: string;
  updated_on: string;
  is_deleted: boolean;
  country_code: string;
  lock_acc_enable: boolean;
  lock_acc_end: string | null;
  login_false_count: number;
  token_version: number;
}


export const UserSchema = z.object({
  id: z.number(),
  user_name: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  full_name: z.string().nullable(),
  birth_date: z.string().nullable(),
  phone: z.string().nullable(),
  address1: z.string().nullable(),
  address2: z.string().nullable(),
  email: z.string().email(),
  email_confirm: z.boolean(),
  password_hash: z.string(),
  password_his: z.string(),
  created_on: z.string(),
  updated_on: z.string(),
  is_deleted: z.boolean(),
  country_code: z.string(),
  lock_acc_enable: z.boolean(),
  lock_acc_end: z.string().nullable(),
  login_false_count: z.number(),
  token_version: z.number(),
  permissions: z.array(z.string()).optional(), // Danh sách quyền của user, nếu có thể lấy được
});
export type UserSchemaType = z.infer<typeof UserSchema>;



// ========== LIST USERS (query params) ==========
export const ListUsersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  // Các filter tìm kiếm
  search: z.string().optional(),  // tìm kiếm chung trên user_name, email, full_name
  user_name: z.string().optional(),
  email: z.string().optional(),
  full_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  country_code: z.string().optional(),
  email_confirm: z.boolean().optional(),
  is_deleted: z.boolean().optional(),        // nếu có trường deleted_at
  birth_date_from: z.string().optional(),   // lọc theo khoảng ngày sinh
  birth_date_to: z.string().optional(),
  created_from: z.string().optional(),
  created_to: z.string().optional(),
  sort_by: z.enum(['id', 'user_name', 'email', 'created_on', 'birth_date', 'full_name', 'created']).default('id'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});
export type ListUsersInput = z.infer<typeof ListUsersSchema>;

// ========== GET USER BY ID (path param) ==========
export const GetUserByIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type GetUserByIdInput = z.infer<typeof GetUserByIdSchema>;

// ========== CREATE OR UPDATE USER (admin) ==========
export const CreateOrUpdateUserSchema = RegisterBaseSchema.omit({ confirm_password: true }).extend({
  password: PasswordSchema,
  email_confirm: z.boolean().default(true), // admin có thể xác nhận luôn
  full_name: z.string().optional(), // admin có thể nhập luôn full_name hoặc để hệ thống tự tạo
  lock_acc_enable: z.boolean().optional(),
  lock_false_count: z.number().int().nonnegative().optional(),
});
export type CreateOrUpdateUserInput = z.infer<typeof CreateOrUpdateUserSchema>;

// ========== DELETE USER ==========
export const DeleteUserSchema = z.object({
  id: z.coerce.number().int().positive(),
});
export type DeleteUserInput = z.infer<typeof DeleteUserSchema>;