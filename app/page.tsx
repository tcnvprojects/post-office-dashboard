'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPasscode } from './actions/auth'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const result = await verifyPasscode(passcode)
    
    if (result.success) {
      if (result.role === 'admin') {
        router.push('/admin')
      } else {
        router.push(`/staff?office_id=${result.office_id}`)
      }
    } else {
      alert('Invalid ID')
      setLoading(false)
      setPasscode('')
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center">
        
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Anjal Payanam</h1>
          <p className="text-blue-100 font-medium text-sm uppercase tracking-widest">Management Portal</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Enter Office ID" 
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full p-5 rounded-2xl bg-white/90 outline-none text-center text-xl font-bold tracking-widest focus:ring-4 focus:ring-blue-300 transition-all shadow-inner" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full p-5 bg-white text-blue-900 font-black rounded-2xl shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex justify-center items-center"
          >
            {loading ? (
              <span className="animate-pulse">VERIFYING...</span>
            ) : (
              'ACCESS PORTAL'
            )}
          </button>
        </form>

        <p className="mt-8 text-blue-200 text-xs font-semibold uppercase">
          Chengalpattu West Sub Division
        </p>
      </div>
    </main>
  )
}