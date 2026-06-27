'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'

const TicketCard = ({ ticket, handleMove, replyingTo, setReplyingTo, replyMessage, setReplyMessage, handleSubmitReply }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
    <div className="flex justify-between items-start mb-2">
      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">#{ticket.ticket_code}</span>
      <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
    </div>
    <h3 className="font-semibold text-gray-800 text-sm">{ticket.offices?.office_name}</h3>
    <p className="text-gray-600 text-sm mt-2 line-clamp-3">{ticket.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {ticket.status === 'open' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-yellow-100 px-2 py-1 rounded">Move to In-Progress</button>}
      {ticket.status === 'in_progress' && <button onClick={() => handleMove(ticket.id, 'open')} className="text-xs bg-gray-100 px-2 py-1 rounded">Move to Open</button>}
      {ticket.status === 'escalated' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Acknowledge</button>}
      {ticket.status !== 'closed' && <button onClick={() => setReplyingTo(ticket.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Reply</button>}
    </div>
    {replyingTo === ticket.id && (
      <div className="mt-4 pt-2 border-t"><textarea className="w-full border p-1 text-sm" rows={2} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} />
        <div className="flex gap-2 mt-1"><button onClick={() => handleSubmitReply(ticket.id, true)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Close</button><button onClick={() => setReplyingTo(null)} className="text-xs underline">Cancel</button></div>
      </div>
    )}
  </div>
)

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const t = await getTickets(); if (t.data) setTickets(t.data)
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
    }
    load()
  }, [])

  async function handleMove(id: string, s: string) { await updateTicketStatus(id, s); const res = await getTickets(); if (res.data) setTickets(res.data) }
  async function handleSubmitReply(id: string, close: boolean) { await addReply(id, "Admin replied", close); const res = await getTickets(); if (res.data) setTickets(res.data) }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-8"><h1 className="text-2xl font-bold">Admin Portal</h1><a href="/" className="text-red-600 font-bold">Logout</a></div>
      <div className="flex gap-4 mb-6"><button onClick={() => setActiveTab('tickets')} className={`font-bold p-2 ${activeTab === 'tickets' ? 'border-b-2 border-black' : ''}`}>Tickets</button><button onClick={() => setActiveTab('performance')} className={`font-bold p-2 ${activeTab === 'performance' ? 'border-b-2 border-black' : ''}`}>Performance</button></div>
      
      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-4 gap-4">
          {['escalated', 'open', 'in_progress', 'closed'].map(status => (
            <div key={status} className="bg-gray-200 p-4 rounded-xl">
              <h2 className="font-bold mb-4 uppercase text-sm">{status}</h2>
              {tickets.filter(t => t.status === status).map(t => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={null} setReplyingTo={() => {}} replyMessage="" setReplyMessage={() => {}} handleSubmitReply={handleSubmitReply} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl">Performance Matrix Loaded ({structure.length} verticals)</div>
      )}
    </main>
  )
}