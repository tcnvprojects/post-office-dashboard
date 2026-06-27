'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

export const dynamic = 'force-dynamic'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')
  
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [raiseBanner, setRaiseBanner] = useState<string | null>(null)
  const [escalateReason, setEscalateReason] = useState('')

  useEffect(() => {
    async function load() {
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
      if (officeId) { const p = await getOfficeMetrics(Number(officeId)); if (!p.error) setOfficeData(p) }
    }
    load()
  }, [officeId])

  async function handleRaise(formData: FormData) {
    formData.append('office_id', officeId || '')
    const res = await createTicket(formData)
    if (res.success) setRaiseBanner(`Ticket #${res.ticketCode} submitted!`)
    else setRaiseBanner('Error: Ensure all fields are filled.')
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Office {officeId} Dashboard</h1>
        <a href="/" className="text-red-600 font-bold hover:underline">Logout</a>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow mb-6 border">
        <h2 className="font-bold text-lg mb-4">Assessment Matrix</h2>
        {!selectedVertical ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold text-blue-900">{v.vertical_name}</button>)}
          </div>
        ) : (
          <div><button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 font-semibold">← Back</button>
          {selectedVertical.parameters.map((p: any) => <div key={p.id} className="flex justify-between p-3 border-b">{p.parameter_name} <b>{officeData?.metrics.find((m:any) => m.parameter_id === p.id)?.actual_value || '—'}</b></div>)}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-bold mb-4">Raise Grievance</h2>
          <form action={handleRaise} className="space-y-3"><textarea name="description" required className="w-full border p-2 rounded-lg" /><button className="bg-blue-600 text-white w-full py-2 rounded-lg font-bold">Submit</button></form>
          {raiseBanner && <p className="mt-2 text-sm text-green-600 font-bold">{raiseBanner}</p>}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h2 className="font-bold mb-4">Check Status</h2>
          <form action={async (fd) => { const r = await getTicketStatus(Number(fd.get('code'))); setTicketDetails(r.data) }} className="flex gap-2"><input name="code" className="border p-2 rounded-lg w-full" placeholder="6-digit code" /><button className="bg-gray-800 text-white px-4 rounded-lg font-bold">Check</button></form>
          {ticketDetails && (
            <div className="mt-4 border-t pt-4">
              <p className="font-bold">Status: {ticketDetails.status.toUpperCase()}</p>
              {ticketDetails.ticket_replies?.map((r:any, i:number) => <p key={i} className="text-sm bg-blue-50 p-2 rounded mt-2"><strong>Admin:</strong> {r.message}</p>)}
              {ticketDetails.status !== 'escalated' && ticketDetails.status !== 'closed' && (
                <div className="mt-4"><input className="border p-1 w-full text-xs" onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason for escalation" /><button onClick={async () => { await escalateTicket(ticketDetails.id, escalateReason); alert('Escalated'); }} className="bg-red-600 text-white w-full py-1 mt-2 rounded text-xs font-bold">Escalate Ticket</button></div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }