'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'

export default function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  // Fetch tickets on load
  async function fetchTickets() {
    setLoading(true)
    const result = await getTickets()
    if (result.data) {
      setTickets(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  // Handle moving a ticket between columns
  async function handleMove(ticketId: string, newStatus: string) {
    await updateTicketStatus(ticketId, newStatus)
    fetchTickets() // Refresh the board
  }

  // Handle submitting a reply
  async function handleSubmitReply(ticketId: string, closeTicket: boolean) {
    if (!replyMessage.trim()) return
    await addReply(ticketId, replyMessage, closeTicket)
    setReplyingTo(null)
    setReplyMessage('')
    fetchTickets() // Refresh the board
  }

  // Group tickets by status
  const openTickets = tickets.filter((t) => t.status === 'open')
  const inProgressTickets = tickets.filter((t) => t.status === 'in_progress')
  const closedTickets = tickets.filter((t) => t.status === 'closed')

  // Reusable Ticket Card Component
  const TicketCard = ({ ticket }: { ticket: any }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
      <div className="flex justify-between items-start mb-2">
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">
          #{ticket.ticket_code}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(ticket.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">
        {ticket.offices?.office_name} ({ticket.offices?.office_id})
      </h3>
      <p className="text-gray-600 text-sm mt-2 line-clamp-3">
        {ticket.description}
      </p>

      {/* Action Buttons based on Status */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ticket.status === 'open' && (
          <button
            onClick={() => handleMove(ticket.id, 'in_progress')}
            className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200"
          >
            Move to In Progress
          </button>
        )}
        
        {ticket.status === 'in_progress' && (
          <button
            onClick={() => handleMove(ticket.id, 'open')}
            className="text-xs bg-gray-100 text-gray-800 px-3 py-1 rounded hover:bg-gray-200"
          >
            Move to Open
          </button>
        )}

        {ticket.status !== 'closed' && (
          <button
            onClick={() => setReplyingTo(ticket.id)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Reply
          </button>
        )}
      </div>

      {/* Inline Reply Form */}
      {replyingTo === ticket.id && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <textarea
            className="w-full text-sm rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            rows={3}
            placeholder="Type your reply to the staff..."
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => handleSubmitReply(ticket.id, true)}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
            >
              Reply & Close Ticket
            </button>
            <button
              onClick={() => handleSubmitReply(ticket.id, false)}
              className="text-xs bg-gray-200 text-gray-800 px-3 py-1.5 rounded hover:bg-gray-300"
            >
              Reply & Keep Open
            </button>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-xs text-red-600 px-3 py-1.5 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Loading Kanban board...</div>
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Ticket Board</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Open */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Open</h2>
              <span className="bg-gray-200 text-gray-700 text-xs py-1 px-2 rounded-full">
                {openTickets.length}
              </span>
            </div>
            {openTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>

          {/* Column 2: In Progress */}
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-blue-800">In Progress</h2>
              <span className="bg-blue-200 text-blue-800 text-xs py-1 px-2 rounded-full">
                {inProgressTickets.length}
              </span>
            </div>
            {inProgressTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>

          {/* Column 3: Closed */}
          <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-green-800">Closed</h2>
              <span className="bg-green-200 text-green-800 text-xs py-1 px-2 rounded-full">
                {closedTickets.length}
              </span>
            </div>
            {closedTickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}