'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [passcode, setPasscode] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Logic to verify passcode and route to /admin or /staff
    if (passcode === 'admin123') router.push('/admin')
    else if (passcode === 'staff123') router.push('/staff?office_id=123')
    else alert('Invalid Passcode')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center">
        <h1 className="text-3xl font-black text-white mb-2">Anjal Payanam</h1>
        <p className="text-blue-100 mb-8 text-sm">Enter Passcode to continue</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            placeholder="Enter Passcode" 
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full p-4 rounded-xl bg-white/90 outline-none text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-400" 
          />
          <button 
            type="submit"
            className="w-full p-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 active:scale-95 transition"
          >
            Access Portal
          </button>
        </form>
      </div>
    </main>
  )
}