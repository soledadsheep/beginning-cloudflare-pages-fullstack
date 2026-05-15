import { login } from '../api/auth.api'

interface Props {
  apiBaseUrl: string
  onMessage: (msg: string) => void
}

export function LoginForm({ apiBaseUrl, onMessage }: Props) {
  const [user_name, setUserName] = useState('')
  const [password, setPassword] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await login(apiBaseUrl, { user_name, password })
    onMessage(result.success
      ? `Welcome, ${result.user?.full_name}!`
      : result.message
    )
  }

  return (
    <form onSubmit={submit}>
      {/* input fields */}
    </form>
  )
}
