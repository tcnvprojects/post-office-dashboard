'use client'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm text-center">
        <h1 className="text-3xl font-black text-white mb-2">Anjal Payanam</h1>
        <p className="text-blue-100 mb-8 text-sm">Management Portal</p>
        
        <form action="/login" className="space-y-4">
          <input type="text" placeholder="Username" className="w-full p-4 rounded-xl bg-white/90 outline-none focus:ring-2 focus:ring-blue-400" />
          <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/90 outline-none focus:ring-2 focus:ring-blue-400" />
          <button className="w-full p-4 bg-white text-blue-900 font-bold rounded-xl shadow-lg hover:bg-blue-50 active:scale-95 transition">
            Login
          </button>
        </form>
      </div>
    </main>
  )
}