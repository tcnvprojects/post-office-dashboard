'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')

  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<{ metrics: any[] } | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')

  useEffect(() => {
    async function load() {
      const struct = await getMatrixStructure(); if (struct.data) setStructure(struct.data)
      if (officeId) {
        const perf = await getOfficeMetrics(Number(officeId))
        if (!perf.error) setOfficeData(perf as any)
      }
    }
    load()
  }, [officeId])

  async function handleStatusSubmit(formData: FormData) {
    const result = await getTicketStatus(Number(formData.get('ticket_code')))
    if (!result.error) setTicketDetails(result.data)
  }

  async function handleEscalate() {
    await escalateTicket(ticketDetails.id, escalateReason)
    const result = await getTicketStatus(ticketDetails.ticket_code)
    setTicketDetails(result.data)
    setIsEscalating(false)
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Office {officeId} Dashboard</h1>
        <a href="/" className="text-red-600 font-bold">Logout</a>
      </div>

      {/* Ticket Result Area - This is where the replies and escalation button are */}
      {ticketDetails && (
        <div className="bg-white p-6 rounded-xl shadow mb-6 border-l-4 border-blue-500">
          <h3 className="font-bold">Ticket #{ticketDetails.ticket_code} - {ticketDetails.status}</h3>
          <p className="mt-2 text-sm">{ticketDetails.description}</p>
          
          {/* History */}
          <div className="mt-4 space-y-2">
            {ticketDetails.ticket_replies?.map((r: any, i: number) => (
              <p key={i} className="text-sm bg-gray-100 p-2 rounded"><strong>Admin:</strong> {r.message}</p>
            ))}
          </div>

          {/* Escalation Button - Visible if not already escalated */}
          {ticketDetails.status !== 'escalated' && (
            <div className="mt-4">
              {!isEscalating ? (
                <button onClick={() => setIsEscalating(true)} className="text-red-600 underline text-sm">Escalate this ticket</button>
              ) : (
                <div className="flex gap-2">
                  <input className="border p-1" onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason..." />
                  <button onClick={handleEscalate} className="bg-red-600 text-white px-2 py-1 rounded">Submit</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Rest of your Performance Matrix and Raise Ticket forms... */}
    </main>
  )
}

export default function StaffDashboard() {
  return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense>
}