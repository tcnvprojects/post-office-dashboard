'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'

// --- TICKET CARD COMPONENT ---
const TicketCard = ({ ticket, handleMove, replyingTo, setReplyingTo, replyMessage, setReplyMessage, handleSubmitReply }: any) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 hover:shadow-md transition">
    <div className="flex justify-between items-start mb-2">
      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">#{ticket.ticket_code}</span>
      <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
    </div>
    <h3 className="font-semibold text-gray-800 text-sm">{ticket.offices?.office_name} ({ticket.offices?.office_id})</h3>
    <p className="text-gray-600 text-sm mt-2 line-clamp-3">{ticket.description}</p>

    <div className="mt-4 flex flex-wrap gap-2">
      {ticket.status === 'open' && (
        <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200">Move to In Progress</button>
      )}
      {ticket.status === 'in_progress' && (
        <button onClick={() => handleMove(ticket.id, 'open')} className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200">Move to Open</button>
      )}
      {ticket.status === 'escalated' && (
        <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Acknowledge</button>
      )}
      {ticket.status !== 'closed' && (
        <button onClick={() => setReplyingTo(ticket.id)} className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Reply</button>
      )}
    </div>

    {replyingTo === ticket.id && (
      <div className="mt-4 pt-4 border-t border-gray-100">
        <textarea
          className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
          rows={3}
          value={replyMessage}
          onChange={(e) => setReplyMessage(e.target.value)}
          autoFocus
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <button onClick={() => handleSubmitReply(ticket.id, true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Reply & Close</button>
          <button onClick={() => handleSubmitReply(ticket.id, false)} className="text-xs bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300">Reply & Keep Open</button>
          <button onClick={() => { setReplyingTo(null); setReplyMessage(''); }} className="text-xs text-red-600 px-3 py-1.5 hover:underline">Cancel</button>
        </div>
      </div>
    )}
  </div>
)

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  async function fetchTickets() {
    setLoading(true)
    const result = await getTickets()
    if (result.data) setTickets(result.data)
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  async function handleMove(ticketId: string, newStatus: string) {
    await updateTicketStatus(ticketId, newStatus)
    fetchTickets()
  }

  async function handleSubmitReply(ticketId: string, closeTicket: boolean) {
    if (!replyMessage.trim()) return
    await addReply(ticketId, replyMessage, closeTicket)
    setReplyingTo(null); setReplyMessage('')
    fetchTickets()
  }

  const escalated = tickets.filter((t) => t.status === 'escalated')
  const open = tickets.filter((t) => t.status === 'open')
  const inProgress = tickets.filter((t) => t.status === 'in_progress')
  const closed = tickets.filter((t) => t.status === 'closed')

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Ticket Board</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Column: Escalated */}
          <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
            <h2 className="font-bold text-red-800 mb-4">🚨 Escalated ({escalated.length})</h2>
            {escalated.map((t) => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyMessage={replyMessage} setReplyMessage={setReplyMessage} handleSubmitReply={handleSubmitReply} />)}
          </div>

          {/* Column: Open */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <h2 className="font-semibold text-gray-700 mb-4">Open ({open.length})</h2>
            {open.map((t) => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyMessage={replyMessage} setReplyMessage={setReplyMessage} handleSubmitReply={handleSubmitReply} />)}
          </div>

          {/* Column: In Progress */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <h2 className="font-semibold text-blue-800 mb-4">In Progress ({inProgress.length})</h2>
            {inProgress.map((t) => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyMessage={replyMessage} setReplyMessage={setReplyMessage} handleSubmitReply={handleSubmitReply} />)}
          </div>

          {/* Column: Closed */}
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <h2 className="font-semibold text-green-800 mb-4">Closed ({closed.length})</h2>
            {closed.map((t) => <TicketCard key={t.id} ticket={t} handleMove={handleMove} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyMessage={replyMessage} setReplyMessage={setReplyMessage} handleSubmitReply={handleSubmitReply} />)}
          </div>
        </div>
      </div>
    </main>
  )
}