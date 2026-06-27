'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')

  const [view, setView] = useState('performance')
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [generatedTicketCode, setGeneratedTicketCode] = useState<string | null>(null)
  
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    async function fetchData() {
      const s = await getMatrixStructure()
      if (s && s.data) setStructure(s.data)
      if (officeId) {
        const m = await getOfficeMetrics(Number(officeId))
        if (m && !m.error) setOfficeData(m)
      }
    }
    fetchData()
  }, [officeId])

  async function handleRaise(formData: FormData) {
    formData.append('office_id', officeId || '')
    const res = await createTicket(formData)
    
    // FIXED: Corrected access to match your type definition
    if (res && res.success) {
      setGeneratedTicketCode(res.ticketCode ? res.ticketCode.toString() : '')
      if (formRef.current) formRef.current.reset()
    } else {
      alert('Failed to submit ticket.')
    }
  }

  async function checkTicketStatus(formData: FormData) {
    const code = Number(formData.get('code'))
    const res = await getTicketStatus(code)
    if (res && res.data) setTicketDetails(res.data)
  }

  const calculateVerticalScore = (v: any) => {
    if (!officeData || !officeData.metrics) return 0
    const pIds = v.parameters?.map((p: any) => p.id) || []
    const ms = officeData.metrics.filter((m: any) => pIds.includes(m.parameter_id))
    if (ms.length === 0) return 0
    const total = ms.reduce((sum: number, m: any) => sum + (Number(m.actual_value) || 0), 0)
    return Math.min(100, Math.round(total / ms.length))
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <h1 className="font-bold text-gray-800 text-lg">Office {officeId}</h1>
        <div className="flex bg-gray-100 p-1 rounded-full">
          <button onClick={() => setView('performance')} className={`px-5 py-2 rounded-full text-xs font-bold transition ${view === 'performance' ? 'bg-white shadow-sm' : ''}`}>STATS</button>
          <button onClick={() => setView('grievance')} className={`px-5 py-2 rounded-full text-xs font-bold transition ${view === 'grievance' ? 'bg-white shadow-sm' : ''}`}>GRIEVANCE</button>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto mt-4">
        {view === 'performance' ? (
          <div className="space-y-4">
            {!selectedVertical ? (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Overall Score</p>
                  <h2 className="text-5xl font-black mt-2">88%</h2>
                </div>
                {structure.map((v: any) => {
                  const s = calculateVerticalScore(v)
                  return (
                    <button key={v.id} onClick={() => setSelectedVertical(v)} className="w-full bg-white p-6 rounded-3xl shadow-sm border text-left">
                      <div className="flex justify-between mb-3 font-bold text-gray-800"><span>{v.vertical_name}</span><span>{s}%</span></div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${s}%` }} /></div>
                    </button>
                  )
                })}
              </>
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-sm border">
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 font-bold mb-6 underline">← Back</button>
                <h3 className="font-black text-xl mb-4">{selectedVertical.vertical_name}</h3>
                {selectedVertical.parameters?.map((p: any) => (
                  <div key={p.id} className="flex justify-between p-4 bg-gray-50 rounded-xl mb-2 font-bold text-sm">
                    {p.parameter_name} <span className="text-blue-600">{officeData?.metrics?.find((m: any) => m.parameter_id === p.id)?.actual_value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
            <h2 className="font-black text-lg">Raise Grievance</h2>
            {generatedTicketCode && (<div className="bg-green-50 p-4 rounded-xl text-sm font-bold text-center">Ticket Code: {generatedTicketCode}</div>)}
            <form ref={formRef} action={handleRaise} className="space-y-4"><textarea name="description" required className="w-full border p-4 rounded-xl bg-gray-50 text-sm" rows={4} /><button className="bg-blue-600 text-white w-full py-4 rounded-xl font-bold">SUBMIT</button></form>
            <div className="border-t pt-6"><form action={checkTicketStatus} className="flex gap-2"><input name="code" required className="border p-4 rounded-xl text-sm w-full" /><button className="bg-gray-800 text-white px-6 rounded-xl font-bold">CHECK</button></form>
              {ticketDetails && (
                <div className="mt-4 bg-gray-50 p-6 rounded-2xl text-sm space-y-2 border">
                  <p className="font-bold">Status: {ticketDetails.status?.toUpperCase()}</p>
                  {ticketDetails.admin_reply && (<div className="mt-2 bg-white p-3 rounded-lg border"><p className="text-[10px] font-bold text-gray-400 uppercase">Reply:</p><p>{ticketDetails.admin_reply}</p></div>)}
                  {ticketDetails.status === 'closed' && (!isEscalating ? (<button onClick={() => setIsEscalating(true)} className="text-red-600 underline font-bold text-xs">Escalate?</button>) : (<div className="flex gap-2"><input className="border p-2 rounded-lg" onChange={(e) => setEscalateReason(e.target.value)} /><button onClick={async () => { await escalateTicket(ticketDetails.id, escalateReason); alert('Escalated'); }} className="bg-red-600 text-white px-3 rounded-lg text-xs">SUBMIT</button></div>))}
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