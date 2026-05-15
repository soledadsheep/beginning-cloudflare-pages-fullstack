export type FormMode = 'login' | 'register' | 'forgot'

export interface RegisterFormData {
  user_name: string
  password: string
  first_name: string
  last_name: string
  full_name: string
  birth_date: string
  email: string
  culture_code: string
}
