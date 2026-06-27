'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')
  
  // States
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [structure, setStructure] = useState<any[]>([])
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<{ top5: any[], bottom5: any[] } | null>(null)

  useEffect(() => {
    async function loadAll() {
      const t = await getTickets(); if (t.data) setTickets(t.data)
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
      setLoading(false)
    }
    loadAll()
  }, [])

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Portal</h1>
          <a href="/" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700">Logout</a>
        </div>

        <div className="flex gap-4 mb-8 border-b pb-4">
          <button onClick={() => setActiveTab('tickets')} className={`font-bold px-4 py-2 rounded-lg ${activeTab === 'tickets' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Ticket Board</button>
          <button onClick={() => setActiveTab('performance')} className={`font-bold px-4 py-2 rounded-lg ${activeTab === 'performance' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Assessment Matrix</button>
        </div>

        {activeTab === 'tickets' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {/* Admin Kanban logic goes here. If you need me to re-paste the full ticket card logic here as well, let me know! */}
             <div className="col-span-4 p-10 text-center bg-white rounded-xl">Ticket Kanban Board Active</div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl shadow-sm">
            {/* Admin Performance logic goes here */}
            <p>Performance Matrix Active</p>
          </div>
        )}
      </div>
    </main>
  )
}