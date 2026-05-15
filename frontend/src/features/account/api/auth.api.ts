export async function login(apiBaseUrl: string, payload: {
  user_name: string
  password: string
}) {
  const res = await fetch(`${apiBaseUrl}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function register(apiBaseUrl: string, payload: any) {
  const res = await fetch(`${apiBaseUrl}/api/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function forgotPassword(apiBaseUrl: string, email: string) {
  const res = await fetch(`${apiBaseUrl}/api/user/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  return res.json()
}
