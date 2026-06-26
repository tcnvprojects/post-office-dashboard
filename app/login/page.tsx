'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError(null)

  const { data, error } = await supabase
    .from('users')
    .select('id, role, office_id')
    .eq('passcode', passcode)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error) {
    console.error('Supabase error:', error)
    setError(`Error: ${error.message}`)
    return
  }

  if (!data) {
    setError('Invalid passcode (no data)')
    return
  }

  localStorage.setItem('session_role', data.role)
  localStorage.setItem('session_office_id', data.office_id ?? '')

  if (data.role === 'admin') {
    window.location.href = '/admin'
  } else {
    window.location.href = '/staff'
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