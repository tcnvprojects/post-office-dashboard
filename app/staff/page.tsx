'use client'

import { useRef, useState } from 'react'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'

export default function StaffDashboard() {
  const raiseFormRef = useRef<HTMLFormElement>(null)
  const [raiseLoading, setRaiseLoading] = useState(false)
  const [raiseBanner, setRaiseBanner] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const statusFormRef = useRef<HTMLFormElement>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any | null>(null)

  // Escalation State
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [escalateLoading, setEscalateLoading] = useState(false)

  async function handleRaiseSubmit(formData: FormData) {
    setRaiseLoading(true)
    setRaiseBanner(null)
    const result = await createTicket(formData)
    setRaiseLoading(false)

    if ('error' in result && result.error) {
      setRaiseBanner({ type: 'error', message: result.error })
      return
    }

    setRaiseBanner({ type: 'success', message: `Ticket ${result.ticketCode} generated. Pls await reply` })
    raiseFormRef.current?.reset()
  }

  async function handleStatusSubmit(formData: FormData) {
    setStatusLoading(true)
    setStatusError(null)
    setTicketDetails(null)
    setIsEscalating(false)
    
    const codeStr = formData.get('ticket_code')?.toString().trim()
    if (!codeStr) {
      setStatusError('Please enter a ticket code.')
      setStatusLoading(false)
      return
    }

    const result = await getTicketStatus(Number(codeStr))
    setStatusLoading(false)

    if (result.error) {
      setStatusError(result.error)
      return
    }

    setTicketDetails(result.data)
  }

  async function handleEscalate() {
    if (!escalateReason.trim()) return
    setEscalateLoading(true)
    
    await escalateTicket(ticketDetails.id, escalateReason)
    
    // Refresh ticket details to show the new status
    const result = await getTicketStatus(ticketDetails.ticket_code)
    if (result.data) setTicketDetails(result.data)
    
    setEscalateLoading(false)
    setIsEscalating(false)
    setEscalateReason('')
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'open': return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded font-semibold uppercase">Open</span>
      case 'in_progress': return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-semibold uppercase">In Progress</span>
      case 'closed': return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold uppercase">Closed</span>
      case 'escalated': return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded font-semibold uppercase">Escalated</span>
      default: return null
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Staff Dashboard</h1>
        
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4 text-center text-gray-500">Score 1 (Pending)</div>
            <div className="rounded-xl border p-4 text-center text-gray-500">Score 2 (Pending)</div>
            <div className="rounded-xl border p-4 text-center text-gray-500">Score 3 (Pending)</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Raise Ticket Panel */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Raise a Grievance</h2>
            <form ref={raiseFormRef} action={handleRaiseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office ID</label>
                <input name="office_id" type="number" required placeholder="e.g., 29100193" className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" required rows={4} placeholder="Describe the issue in detail..." className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button type="submit" disabled={raiseLoading} className="w-full rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {raiseLoading ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
            {raiseBanner && (
              <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${raiseBanner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border`}>
                {raiseBanner.message}
              </div>
            )}
          </div>

          {/* Check Status Panel */}
          <div className="bg-white rounded-2xl shadow p-6 border-t-4 border-gray-800">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Check Ticket Status</h2>
            <form ref={statusFormRef} action={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">6-Digit Ticket Code</label>
                <div className="flex gap-2">
                  <input name="ticket_code" type="number" required placeholder="e.g., 482917" className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-gray-500" />
                  <button type="submit" disabled={statusLoading} className="rounded-lg bg-gray-800 px-5 py-2 font-semibold text-white hover:bg-gray-900 disabled:opacity-50">
                    {statusLoading ? 'Checking...' : 'Check'}
                  </button>
                </div>
              </div>
            </form>

            {statusError && <div className="mt-4 text-sm text-red-600 font-medium">{statusError}</div>}

            {ticketDetails && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">Ticket #{ticketDetails.ticket_code}</h3>
                    <p className="text-xs text-gray-500">{new Date(ticketDetails.created_at).toLocaleString()}</p>
                  </div>
                  {getStatusBadge(ticketDetails.status)}
                </div>
                
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Your Grievance</p>
                  <p className="text-sm text-gray-700 mt-1">{ticketDetails.description}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Replies</p>
                  {ticketDetails.ticket_replies?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No replies yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {ticketDetails.ticket_replies.map((reply: any, idx: number) => (
                        <div key={idx} className={`p-3 rounded-r-lg border-l-4 ${reply.message.includes('🚨') ? 'bg-red-50 border-red-500' : 'bg-blue-50 border-blue-500'}`}>
                          <p className="text-sm text-gray-800 font-medium">{reply.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(reply.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Escalation Area */}
                {ticketDetails.status !== 'escalated' && ticketDetails.status !== 'closed' && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    {!isEscalating ? (
                      <button onClick={() => setIsEscalating(true)} className="text-sm text-red-600 hover:underline font-semibold">
                        ⚠️ Not satisfied? Escalate this ticket
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-gray-700">Reason for escalation:</label>
                        <textarea
                          rows={2}
                          className="w-full rounded-lg border border-gray-300 p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Why are you escalating this?"
                          value={escalateReason}
                          onChange={(e) => setEscalateReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleEscalate} disabled={escalateLoading || !escalateReason.trim()} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50">
                            {escalateLoading ? 'Escalating...' : 'Submit Escalation'}
                          </button>
                          <button onClick={() => setIsEscalating(false)} className="text-xs text-gray-600 hover:underline px-2">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}