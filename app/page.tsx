'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { verifyPasscode } from '@/app/actions/auth'

export default function LoginPage() {
  const [input, setInput] = useState('')
  const router = useRouter()

  async function handleLogin() {
    const res = await verifyPasscode(input)
    if (res.success) {
      if (res.role === 'admin') router.push('/admin')
      else router.push(`/staff?office_id=${res.office_id}`)
    } else {
      alert('Invalid Code')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border border-gray-100 text-center">
        {/* LOGO ADDED */}
        <img src="/logo.jpg" alt="Dak Connect" className="h-24 mx-auto mb-6 object-contain" />
        
        <h1 className="text-2xl font-black text-gray-900 mb-2">Welcome Back</h1>
        <p className="text-gray-500 text-sm mb-6">Enter your office code to continue</p>
        
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          className="w-full bg-gray-100 border-0 p-4 rounded-xl mb-4 font-bold text-center text-lg outline-none focus:ring-2 focus:ring-red-500"
          placeholder="000000"
        />
        
        <button 
          onClick={handleLogin} 
          className="w-full py-4 bg-red-600 text-white rounded-xl font-black shadow-lg hover:bg-red-700 transition active:scale-95"
        >
          LOGIN
        </button>
      </div>
    </main>
  )
}