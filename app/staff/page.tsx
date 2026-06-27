'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

export const dynamic = 'force-dynamic'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')
  const [view, setView] = useState<'matrix' | 'grievance'>('matrix')
  
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [raiseBanner, setRaiseBanner] = useState<string | null>(null)
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
    formData.append('office_id', officeId || '')
    const res = await createTicket(formData)
    if (res.success) setRaiseBanner(`Ticket #${res.ticketCode} submitted!`)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-blue-900">Anjal Payanam: Office {officeId}</h1>
        <div className="flex gap-4">
          <button onClick={() => setView('matrix')} className="text-sm font-bold">Performance</button>
          <button onClick={() => setView('grievance')} className="text-sm font-bold text-blue-600">Grievance</button>
          <a href="/" className="text-sm font-bold text-red-600">Logout</a>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {view === 'matrix' ? (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="font-bold text-lg mb-4">Assessment Matrix</h2>
            {!selectedVertical ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="p-4 bg-blue-50 rounded-lg font-bold text-blue-900">{v.vertical_name}</button>)}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 font-semibold underline">← Back</button>
                {selectedVertical.parameters.map((p: any) => <div key={p.id} className="flex justify-between p-3 border-b">{p.parameter_name} <b>{officeData?.metrics.find((m:any) => m.parameter_id === p.id)?.actual_value || '—'}</b></div>)}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow border">
            <h2 className="font-bold mb-4">Grievance Portal</h2>
            <form action={handleRaise} className="space-y-3"><textarea name="description" required className="w-full border p-2 rounded-lg" /><button className="bg-blue-600 text-white w-full py-2 rounded-lg font-bold">Submit</button></form>
            {raiseBanner && <p className="mt-2 text-sm text-green-600 font-bold">{raiseBanner}</p>}
            <hr className="my-6" />
            <form action={async (fd) => { const r = await getTicketStatus(Number(fd.get('code'))); setTicketDetails(r.data) }} className="flex gap-2"><input name="code" className="border p-2 rounded-lg w-full" placeholder="6-digit code" /><button className="bg-gray-800 text-white px-4 rounded-lg font-bold">Check</button></form>
            {ticketDetails && <div className="mt-4 border-t pt-4">
               <p className="font-bold">Status: {ticketDetails.status.toUpperCase()}</p>
               {ticketDetails.ticket_replies?.map((r:any, i:number) => <p key={i} className="text-sm bg-blue-50 p-2 rounded mt-1">Admin: {r.message}</p>)}
               {ticketDetails.status === 'closed' && (
                 <div>{!isEscalating ? <button onClick={() => setIsEscalating(true)} className="text-red-600 underline text-xs">Escalate to re-open?</button> : <div className="flex gap-2 mt-2"><input className="border p-1 w-full text-xs" onChange={(e) => setEscalateReason(e.target.value)} /><button onClick={async () => { await escalateTicket(ticketDetails.id, escalateReason); alert('Escalated'); }} className="bg-red-600 text-white px-2 rounded text-xs font-bold">Submit</button></div>}</div>
               )}
            </div>}
          </div>
        )}
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }