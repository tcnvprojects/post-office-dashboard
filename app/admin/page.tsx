'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'

const TicketCard = ({ ticket, handleMove, setReplyingTo }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border mb-3">
    <div className="flex justify-between text-xs font-bold mb-1"><span>#{ticket.ticket_code}</span><span>{ticket.offices?.office_name}</span></div>
    <p className="text-sm mb-3">{ticket.description}</p>
    <div className="flex gap-1">
      {ticket.status === 'open' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-yellow-100 p-1 rounded">Move to In-Prog</button>}
      {ticket.status === 'in_progress' && <button onClick={() => handleMove(ticket.id, 'open')} className="text-xs bg-gray-100 p-1 rounded">Re-Open</button>}
      {ticket.status !== 'closed' && <button onClick={() => setReplyingTo(ticket.id)} className="text-xs bg-blue-600 text-white p-1 rounded">Reply</button>}
    </div>
  </div>
)

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)

  useEffect(() => {
    async function load() {
      const t = await getTickets(); if (t.data) setTickets(t.data)
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
    }
    load()
  }, [])

  async function handleMove(id: string, s: string) { await updateTicketStatus(id, s); const r = await getTickets(); if (r.data) setTickets(r.data) }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">Admin Portal</h1><a href="/" className="bg-red-600 text-white px-4 py-2 rounded-lg">Logout</a></div>
      <div className="flex gap-4 mb-6"><button onClick={() => setActiveTab('tickets')} className="font-bold">Tickets</button><button onClick={() => setActiveTab('performance')} className="font-bold">Matrix</button></div>
      
      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-4 gap-4">
          {['escalated', 'open', 'in_progress', 'closed'].map(status => (
            <div key={status} className="bg-gray-200 p-4 rounded-xl">
              <h2 className="font-bold uppercase text-xs mb-4">{status}</h2>
              {tickets.filter(t => t.status === status).map(t => <TicketCard key={t.id} ticket={t} handleMove={handleMove} setReplyingTo={() => {}} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl">
          {!selectedParam ? structure.flatMap(v => v.parameters).map((p:any) => <button key={p.id} onClick={async() => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="block border-b w-full p-2">{p.parameter_name}</button>) :
          <div><button onClick={() => setSelectedParam(null)} className="text-blue-600">← Back</button>
          <div className="flex gap-10 mt-4"><div className="bg-green-50 p-4">Top 5: {leaderboard?.top5.length || 0}</div><div className="bg-red-50 p-4">Bottom 5: {leaderboard?.bottom5.length || 0}</div></div></div>}
        </div>
      )}
    </main>
  )
}