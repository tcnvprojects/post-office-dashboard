'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Login failed')
        return
      }

      const role = json.role as string
      const office_id = json.office_id as string | null

      // Simple client-side session for now
      localStorage.setItem('session_role', role)
      localStorage.setItem('session_office_id', office_id ?? '')

      if (role === 'admin') {
        window.location.href = '/admin'
      } else {
        window.location.href = '/staff'
      }
    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <form onSubmit={handleLogin}>
        <label>
          Passcode
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
          />
        </label>
        <button type="submit">Login</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  )
}