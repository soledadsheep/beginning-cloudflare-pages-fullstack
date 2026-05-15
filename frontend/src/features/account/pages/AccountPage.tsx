import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../../../config'
import { FormMode } from '../types'
import { LoginForm } from '../components/LoginForm'
import { RegisterForm } from '../components/RegisterForm'
import { ForgotPasswordForm } from '../components/ForgotPasswordForm'

export function AccountPage() {
  const [mode, setMode] = useState<FormMode>('login')
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl)
  }, [])

  return (
    <div>
      {/* tab buttons */}
      {mode === 'login' && <LoginForm apiBaseUrl={apiBaseUrl} onMessage={setMessage} />}
      {mode === 'register' && <RegisterForm apiBaseUrl={apiBaseUrl} onMessage={setMessage} />}
      {mode === 'forgot' && <ForgotPasswordForm apiBaseUrl={apiBaseUrl} onMessage={setMessage} />}
    </div>
  )
}
