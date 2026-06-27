'use client'

import { useRef, useState, useEffect, Suspense } from 'react'
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
  
  // Ticket States
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [raiseBanner, setRaiseBanner] = useState<{type: 'success'|'error', msg: string} | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')

  useEffect(() => {
    async function load() {
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
      if (officeId) { const p = await getOfficeMetrics(Number(officeId)); if (!p.error) setOfficeData(p) }
    }
    load()
  }, [officeId])

  async function handleRaise(formData: FormData) {
    const res = await createTicket(formData)
    if (res.success) setRaiseBanner({type: 'success', msg: `Ticket #${res.ticketCode} submitted successfully.`})
    else setRaiseBanner({type: 'error', msg: res.error || 'Submission failed'})
  }

  async function handleStatus(formData: FormData) {
    const r = await getTicketStatus(Number(formData.get('code')))
    if (!r.error) setTicketDetails(r.data)
    else setTicketDetails(null)
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
        <h1 className="text-xl font-bold">Office {officeId} Dashboard</h1>
        <a href="/" className="text-red-600 font-bold hover:underline">Logout</a>
      </div>
      
      {/* Performance Drill-down */}
      <div className="bg-white p-6 rounded-xl shadow mb-6 border border-gray-100">
        <h2 className="font-bold text-lg mb-4">Assessment Matrix</h2>
        {!selectedVertical ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg font-bold text-blue-900 transition">{v.vertical_name}</button>)}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 font-semibold">← Back to Verticals</button>
            <div className="space-y-2">
              {selectedVertical.parameters.map((p: any) => (
                <div key={p.id} className="flex justify-between p-3 border-b hover:bg-gray-50">
                  <span className="font-medium text-sm">{p.parameter_name}</span>
                  <span className="font-bold text-blue-600">{officeData?.metrics.find((m:any) => m.parameter_id === p.id)?.actual_value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tickets Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="font-bold mb-4">Raise Ticket</h2>
          <form action={handleRaise} className="space-y-3">
            <textarea name="description" required className="w-full border p-2 rounded-lg" placeholder="Describe grievance..." />
            <button className="bg-blue-600 text-white w-full py-2 rounded-lg font-bold">Submit</button>
          </form>
          {raiseBanner && <div className={`mt-3 p-2 rounded text-sm ${raiseBanner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100'}`}>{raiseBanner.msg}</div>}
        </div>

        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="font-bold mb-4">Check Status</h2>
          <form action={handleStatus} className="flex gap-2">
            <input name="code" className="border p-2 rounded-lg w-full" placeholder="6-digit code" />
            <button className="bg-gray-800 text-white px-4 rounded-lg font-bold">Check</button>
          </form>
          {ticketDetails && (
            <div className="mt-4 border-t pt-4 space-y-3">
              <p className="font-bold">Status: {ticketDetails.status.toUpperCase()}</p>
              {ticketDetails.ticket_replies?.map((r:any, i:number) => <p key={i} className="text-sm bg-blue-50 p-2 rounded"><strong>Admin:</strong> {r.message}</p>)}
              {ticketDetails.status !== 'escalated' && ticketDetails.status !== 'closed' && (
                <div>
                  {!isEscalating ? <button onClick={() => setIsEscalating(true)} className="text-red-600 underline text-xs">Escalate ticket?</button> : 
                  <div className="flex gap-2 mt-2"><input className="border p-1 text-xs" onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason..." />
                  <button onClick={async () => { await escalateTicket(ticketDetails.id, escalateReason); alert('Escalated'); setIsEscalating(false); }} className="bg-red-600 text-white px-2 rounded">Submit</button></div>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }