'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validateLogin } from '@/app/actions/auth'

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await validateLogin(code)

    if ('error' in result && result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (result.role === 'admin') {
      router.push('/admin')
    } else {
      router.push(`/staff?office_id=${result.officeId}`)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter Office ID (or Admin Code)
            </label>
            <input
              type="number"
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
        {error && <p className="mt-4 text-center text-red-600 text-sm font-medium">{error}</p>}
      </div>
    </main>
  )
}