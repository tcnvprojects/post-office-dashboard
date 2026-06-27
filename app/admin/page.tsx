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
    <h3 className="font-semibold text-gray-800 text-sm">{ticket.offices?.office_name} ({ticket.offices?.office_id})</h3>
    <p className="text-gray-600 text-sm mt-2 line-clamp-3">{ticket.description}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {ticket.status === 'open' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200">Move to In-Progress</button>}
      {ticket.status === 'in_progress' && <button onClick={() => handleMove(ticket.id, 'open')} className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200">Move to Open</button>}
      {ticket.status === 'escalated' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Acknowledge</button>}
      {ticket.status !== 'closed' && <button onClick={() => setReplyingTo(ticket.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Reply</button>}
    </div>
    {replyingTo === ticket.id && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <textarea className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={3} value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} />
        <div className="flex gap-2 mt-2">
          <button onClick={() => handleSubmitReply(ticket.id, true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded">Reply & Close</button>
          <button onClick={() => setReplyingTo(null)} className="text-xs text-red-600 px-3 py-1.5 underline">Cancel</button>
        </div>
      </div>
    )}
  </div>
)

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
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
  async function handleSubmitReply(id: string, close: boolean) { await addReply(id, "Admin acknowledged", close); const r = await getTickets(); if (r.data) setTickets(r.data) }
  async function handleParamClick(p: any) { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l) }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-8"><h1 className="text-3xl font-bold">Admin Portal</h1><a href="/" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Logout</a></div>
      <div className="flex gap-4 mb-8 border-b pb-4">
        <button onClick={() => setActiveTab('tickets')} className={`text-xl font-bold p-2 ${activeTab === 'tickets' ? 'border-b-2 border-black' : ''}`}>Ticket Board</button>
        <button onClick={() => setActiveTab('performance')} className={`text-xl font-bold p-2 ${activeTab === 'performance' ? 'border-b-2 border-black' : ''}`}>Assessment Matrix</button>
      </div>

      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-4 gap-4">
          {['escalated', 'open', 'in_progress', 'closed'].map(status => (
            <div key={status} className="bg-gray-200 p-4 rounded-2xl">
              <h2 className="font-bold mb-4 uppercase text-sm">{status} ({tickets.filter(t => t.status === status).length})</h2>
              {tickets.filter(t => t.status === status).map(t => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={null} setReplyingTo={() => {}} replyMessage="" setReplyMessage={() => {}} handleSubmitReply={handleSubmitReply} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl">
          {!selectedVertical && structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="block w-full text-left p-4 border rounded-xl mb-2 font-bold">{v.vertical_name}</button>)}
          {selectedVertical && !selectedParam && (
            <div><button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 underline">← Back</button>
            {selectedVertical.parameters.map((p: any) => <button key={p.id} onClick={() => handleParamClick(p)} className="block p-3 border rounded mb-2">{p.parameter_name}</button>)}</div>
          )}
          {selectedParam && (
            <div><button onClick={() => setSelectedParam(null)} className="text-blue-600 mb-4 underline">← Back to Params</button>
            <h2 className="text-xl font-bold">{selectedParam.parameter_name} Rankings</h2>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-green-50 p-4">Top 5: {leaderboard?.top5.length || 0} offices</div>
              <div className="bg-red-50 p-4">Bottom 5: {leaderboard?.bottom5.length || 0} offices</div>
            </div></div>
          )}
        </div>
      )}
    </main>
  )
}