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
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [raiseBanner, setRaiseBanner] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
      if (officeId) { const p = await getOfficeMetrics(Number(officeId)); if (!p.error) setOfficeData(p) }
    }
    load()
  }, [officeId])

  async function handleRaise(formData: FormData) {
    const res = await createTicket(formData)
    if (res.success) setRaiseBanner(`Ticket created: ${res.ticketCode}`)
  }

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between mb-6"><h1 className="text-2xl font-bold">Office {officeId}</h1><a href="/" className="text-red-600 font-bold">Logout</a></div>
      
      <div className="bg-white p-6 rounded-xl shadow mb-6">
        <h2 className="font-bold mb-4">Assessment Matrix</h2>
        {!selectedVertical ? (
          <div className="grid grid-cols-3 gap-4">{structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="p-4 bg-blue-50 rounded-lg">{v.vertical_name}</button>)}</div>
        ) : (
          <div><button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 underline">← Back</button>
          {selectedVertical.parameters.map((p: any) => <div key={p.id} className="flex justify-between p-2 border-b">{p.parameter_name} <b>{officeData?.metrics.find((m:any) => m.parameter_id === p.id)?.actual_value || 'N/A'}</b></div>)}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow"><h2 className="font-bold">Raise Ticket</h2><form action={handleRaise}><textarea name="description" className="w-full border p-2 my-2" /><button className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button></form>{raiseBanner && <p className="text-green-600 mt-2">{raiseBanner}</p>}</div>
        <div className="bg-white p-6 rounded-xl shadow"><h2 className="font-bold">Check Status</h2><form action={async (fd) => { const r = await getTicketStatus(Number(fd.get('code'))); setTicketDetails(r.data) }}><input name="code" className="border p-2" /><button className="bg-gray-800 text-white px-4 py-2 ml-2">Check</button></form>
          {ticketDetails && <div className="mt-4 border-t pt-4">Status: {ticketDetails.status} {ticketDetails.status !== 'escalated' && <button onClick={async () => { await escalateTicket(ticketDetails.id, 'Escalated'); alert('Done'); }} className="text-red-600 underline ml-2">Escalate</button>}</div>}
        </div>
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }