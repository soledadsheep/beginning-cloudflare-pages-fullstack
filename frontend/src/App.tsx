import { useState, useEffect } from 'react'
import { getApiBaseUrl } from './config'

type FormMode = 'login' | 'register' | 'forgot'

function App() {
  const [mode, setMode] = useState<FormMode>('login')
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('')
  const [formData, setFormData] = useState({
    user_name: '',
    password: '',
    first_name: '',
    last_name: '',
    full_name: '',
    birth_date: '',
    email: '',
    culture_code: 'vi'
  })
  const [forgotEmail, setForgotEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getApiBaseUrl().then(setApiBaseUrl)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!apiBaseUrl) return
    try {
      if (mode === 'login') {
        const response = await fetch(`${apiBaseUrl}/api/user/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_name: formData.user_name, password: formData.password })
        })
        const result = await response.json()
        setMessage(result.success ? `Welcome, ${result.user?.full_name}!` : result.message)
      } else if (mode === 'register') {
        const response = await fetch(`${apiBaseUrl}/api/user/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        const result = await response.json()
        setMessage(result.success ? 'Registration successful!' : result.message)
      }
    } catch (error) {
      setMessage('Network error')
    }
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!apiBaseUrl) return
    try {
      const response = await fetch(`${apiBaseUrl}/api/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const result = await response.json()
      setMessage(result.success ? 'Password reset email sent!' : result.message)
    } catch (error) {
      setMessage('Network error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setMode('login')}
            className={`px-4 py-2 ${mode === 'login' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-4 py-2 ${mode === 'register' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Register
          </button>
          <button
            onClick={() => setMode('forgot')}
            className={`px-4 py-2 ${mode === 'forgot' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Forgot Password
          </button>
        </div>
        {message && <p className="mb-4 text-center text-red-500">{message}</p>}
        {mode === 'forgot' ? (
          <form onSubmit={handleForgotSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Email</label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Send Reset Email
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Username</label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            {mode === 'register' && (
              <>
                <div className="mb-4">
                  <label className="block text-gray-700">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Full Name</label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Birth Date</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded"
                    required
                  />
                </div>
              </>
            )}
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              {mode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App