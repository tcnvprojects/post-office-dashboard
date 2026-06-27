'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')
  const [perf, setPerf] = useState<any>(null)
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    async function load() {
      if (officeId) {
        const res = await getOfficeMetrics(Number(officeId))
        if (!res.error) setPerf(res)
      }
    }
    load()
  }, [officeId])

  async function handleStatus(formData: FormData) {
    const res = await getTicketStatus(Number(formData.get('code')))
    if (!res.error) setTicketDetails(res.data)
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6"><h1 className="font-bold text-xl">Office {officeId}</h1><a href="/" className="text-red-600">Logout</a></div>
      
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="font-bold mb-4">Performance Metrics</h2>
        {perf ? <p>Data loaded for {perf.office.office_name}</p> : <p>Loading...</p>}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-2">Raise Ticket</h2>
          <form action={async (fd) => { await createTicket(fd); alert('Submitted'); }}>
            <textarea name="description" className="w-full border p-2 mb-2" placeholder="Description" />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-2">Check Ticket</h2>
          <form action={handleStatus} className="flex gap-2">
            <input name="code" className="border p-2" placeholder="6-digit code" />
            <button className="bg-gray-800 text-white px-4 py-2 rounded">Check</button>
          </form>
          {ticketDetails && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <p>Status: {ticketDetails.status}</p>
              {ticketDetails.ticket_replies?.map((r:any, i:number) => <p key={i} className="text-sm mt-1">- {r.message}</p>)}
              {ticketDetails.status !== 'escalated' && (
                <div className="mt-2 flex gap-2"><input className="border p-1" onChange={(e) => setReason(e.target.value)} placeholder="Escalate reason" /><button onClick={async () => { await escalateTicket(ticketDetails.id, reason); alert('Escalated'); }} className="bg-red-600 text-white px-2 rounded">Escalate</button></div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }