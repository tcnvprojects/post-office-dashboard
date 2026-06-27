'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPasscode } from './actions/auth'

export default function LoginPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // We pass the input to our robust verifier
    const result = await verifyPasscode(input)
    
    if (result.success) {
      if (result.role === 'admin') {
        router.push('/admin')
      } else {
        router.push(`/staff?office_id=${result.office_id}`)
      }
    } else {
      alert('Invalid ID or Passcode')
      setLoading(false)
      setInput('')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center">
        <h1 className="text-4xl font-black text-white mb-8 tracking-tight">Anjal Payanam</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="text" 
            placeholder="Enter ID or Passcode" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-5 rounded-2xl bg-white/90 outline-none text-center text-xl font-bold tracking-widest" 
          />
          <button type="submit" disabled={loading} className="w-full p-5 bg-white text-blue-900 font-black rounded-2xl shadow-lg">
            {loading ? 'VERIFYING...' : 'ACCESS PORTAL'}
          </button>
        </form>
      </div>
    </main>
  )
}