'use client'

export default function Header({ role, onGrievance }: { role: 'staff' | 'admin', onGrievance: () => void }) {
  return (
    <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
      <h1 className="font-bold text-lg text-blue-900">Anjal Payanam: Chengalpattu West</h1>
      <div className="flex gap-4">
        <button onClick={onGrievance} className="text-sm font-bold text-gray-600 hover:text-blue-600">Grievance</button>
        {role === 'admin' && <a href="/admin/bulk" className="text-sm font-bold text-gray-600 hover:text-blue-600">Bulk Upload</a>}
        <a href="/" className="text-sm font-bold text-red-600 hover:underline">Logout</a>
      </div>
    </header>
  )
}