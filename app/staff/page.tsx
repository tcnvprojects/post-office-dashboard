'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
  
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  
  // RESTORED: State to hold the newly generated ticket code for the banner
  const [generatedTicketCode, setGeneratedTicketCode] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    async function fetchData() {
      const structureResult = await getMatrixStructure()
      if (structureResult.data) setStructure(structureResult.data)
      
      if (officeId) {
        const metricsResult = await getOfficeMetrics(Number(officeId))
        if (!metricsResult.error) setOfficeData(metricsResult)
      }
    }
    fetchData()
  }, [officeId])

  async function handleRaise(formData: FormData) {
    formData.append('office_id', officeId || '')
    const response = await createTicket(formData)
    
    // RESTORED: Capture the ticket code from the response and display the banner
    if (response.success) {
      setGeneratedTicketCode(response.data?.ticket_code || response.ticket_code)
      formRef.current?.reset() // clear the form
    } else {
      alert('Failed to submit ticket.')
    }
  }

  async function checkTicketStatus(formData: FormData) {
    const code = Number(formData.get('code'))
    const response = await getTicketStatus(code)
    if (response.data) {
      setTicketDetails(response.data)
    } else {
      alert('Ticket not found')
    }
  }

  async function handleEscalation() {
    if (ticketDetails && ticketDetails.id) {
      await escalateTicket(ticketDetails.id, escalateReason)
      alert('Escalated successfully')
      setIsEscalating(false)
      // refresh status visually
      const refreshed = await getTicketStatus(ticketDetails.ticket_code)
      if(refreshed.data) setTicketDetails(refreshed.data)
    }
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
                
                {structure.map((vertical) => (
                  <button key={vertical.id} onClick={() => setSelectedVertical(vertical)} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left hover:shadow-md transition">
                    <div className="flex justify-between mb-3 font-bold text-gray-800">
                      <span>{vertical.vertical_name}</span><span>85%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[85%]" /></div>
                  </button>
                ))}
              </>
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 font-bold mb-6 underline">← Back to Stats</button>
                <h3 className="font-black text-xl mb-4">{selectedVertical.vertical_name}</h3>
                {selectedVertical.parameters.map((parameter: any) => (
                  <div key={parameter.id} className="flex justify-between p-4 bg-gray-50 rounded-xl mb-2 font-bold text-sm">
                    {parameter.parameter_name} 
                    <span className="text-blue-600 font-black">{officeData?.metrics.find((m: any) => m.parameter_id === parameter.id)?.actual_value || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="font-black text-lg">Raise Grievance</h2>
            
            {/* RESTORED: Success Banner */}
            {generatedTicketCode && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm font-bold text-center">
                Ticket Created! Your Reference Code:<br/>
                <span className="text-2xl font-black mt-2 block">{generatedTicketCode}</span>
              </div>
            )}

            <form ref={formRef} action={handleRaise} className="space-y-4">
              <textarea name="description" required className="w-full border p-4 rounded-xl bg-gray-50 text-sm" placeholder="Type your issue here..." rows={4} />
              <button className="bg-blue-600 text-white w-full py-4 rounded-xl font-bold hover:bg-blue-700 transition">SUBMIT TICKET</button>
            </form>
            
            <div className="border-t pt-6">
              <form action={checkTicketStatus} className="flex gap-2">
                <input name="code" required className="border bg-gray-50 p-4 rounded-xl text-sm w-full" placeholder="Enter 6-digit code" />
                <button className="bg-gray-800 text-white px-6 rounded-xl font-bold">CHECK</button>
              </form>
              
              {ticketDetails && (
                <div className="mt-4 bg-gray-50 p-6 rounded-2xl text-sm space-y-3 border">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-black text-gray-500">#{ticketDetails.ticket_code}</span>
                    <span className="font-black text-blue-600 uppercase tracking-widest">{ticketDetails.status}</span>
                  </div>
                  
                  {/* Show the admin's reply if it exists */}
                  {ticketDetails.admin_reply && (
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-1">Admin Response:</p>
                      <p className="text-gray-800">{ticketDetails.admin_reply}</p>
                    </div>
                  )}
                  
                  {ticketDetails.status === 'closed' && (
                    <div>
                      {!isEscalating ? (
                        <button onClick={() => setIsEscalating(true)} className="text-red-600 underline font-bold text-xs mt-2">Escalate to re-open?</button>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <input className="border p-2 rounded-lg w-full text-xs bg-white" placeholder="Reason for escalation..." onChange={(e) => setEscalateReason(e.target.value)} />
                          <button onClick={handleEscalation} className="bg-red-600 text-white px-3 rounded-lg font-bold text-xs">SUBMIT</button>
                        </div>
                      )}
                    </div>
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

export default function StaffPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}