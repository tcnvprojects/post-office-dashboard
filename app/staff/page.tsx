'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')
  
  const [view, setView] = useState<'performance' | 'grievance'>('performance')
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  
  // Grievance states
  const [ticketDetails, setTicketDetails] = useState<any>(null)
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
    if (res.success) alert('Ticket Submitted!')
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm sticky top-0 z-50">
        <h1 className="font-bold text-blue-900">Office {officeId}</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('performance')} className={`px-4 py-1 rounded-lg text-xs font-bold ${view === 'performance' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Stats</button>
          <button onClick={() => setView('grievance')} className={`px-4 py-1 rounded-lg text-xs font-bold ${view === 'grievance' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Grievance</button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {view === 'performance' ? (
          <div className="space-y-4">
             {!selectedVertical ? (
               <>
                 <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-3xl text-white text-center shadow-lg">
                    <p className="text-blue-100 text-xs font-bold uppercase">Overall Score</p>
                    <h2 className="text-4xl font-black">88%</h2>
                 </div>
                 {structure.map(v => (
                   <button key={v.id} onClick={() => setSelectedVertical(v)} className="w-full bg-white p-5 rounded-2xl shadow-sm text-left">
                     <div className="flex justify-between mb-2 text-sm font-bold"><span>{v.vertical_name}</span><span>85%</span></div>
                     <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[85%]" /></div>
                   </button>
                 ))}
               </>
             ) : (
               <div className="bg-white p-6 rounded-2xl shadow-sm">
                 <button onClick={() => setSelectedVertical(null)} className="text-blue-600 font-bold mb-4 underline">← Back</button>
                 <h3 className="font-bold mb-4">{selectedVertical.vertical_name} Details</h3>
                 {selectedVertical.parameters.map((p:any) => (
                   <div key={p.id} className="flex justify-between p-3 border-b text-sm font-semibold">{p.parameter_name} <span className="text-blue-600 font-black">{officeData?.metrics.find((m:any) => m.parameter_id === p.id)?.actual_value || '—'}</span></div>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="font-bold text-lg">Raise Grievance</h2>
            <form action={handleRaise} className="space-y-3">
              <textarea name="description" required className="w-full border p-3 rounded-xl bg-gray-50" placeholder="Type issue here..." />
              <button className="bg-blue-600 text-white w-full py-3 rounded-xl font-bold">Submit</button>
            </form>
            <div className="border-t pt-6">
              <form action={async (fd) => { const r = await getTicketStatus(Number(fd.get('code'))); setTicketDetails(r.data) }} className="flex gap-2">
                <input name="code" className="border p-2 rounded-lg w-full" placeholder="Enter 6-digit code" />
                <button className="bg-gray-800 text-white px-4 rounded-lg font-bold">Check</button>
              </form>
              {ticketDetails && (
                <div className="mt-4 bg-gray-50 p-4 rounded-xl text-sm">
                   <p className="font-bold mb-2">Status: {ticketDetails.status.toUpperCase()}</p>
                   {ticketDetails.status === 'closed' && (
                     <div>{!isEscalating ? <button onClick={() => setIsEscalating(true)} className="text-red-600 underline font-bold text-xs">Escalate to re-open?</button> : <div className="flex gap-2 mt-2"><input className="border p-1 w-full text-xs" onChange={(e) => setEscalateReason(e.target.value)} /><button onClick={async () => { await escalateTicket(ticketDetails.id, escalateReason); alert('Escalated'); }} className="bg-red-600 text-white px-2 rounded font-bold text-xs">Submit</button></div>}</div>
                   )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function StaffPage() { return <Suspense fallback={<div>Loading...</div>}><DashboardContent /></Suspense> }