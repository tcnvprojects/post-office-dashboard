'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

function DashboardContent() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')
  
  // VIEW STATE
  const [view, setView] = useState<'performance' | 'grievance'>('performance')
  
  // DATA STATES
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  
  // TICKET STATES
  const [ticketDetails, setTicketDetails] = useState<any>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')

  // DATA FETCHING
  useEffect(() => {
    async function fetchData() {
      // Fetch the matrix structure
      const structureResult = await getMatrixStructure()
      if (structureResult.data) {
        setStructure(structureResult.data)
      }
      
      // Fetch office metrics if we have an ID
      if (officeId) {
        const metricsResult = await getOfficeMetrics(Number(officeId))
        if (!metricsResult.error) {
          setOfficeData(metricsResult)
        }
      }
    }
    fetchData()
  }, [officeId])

  // TICKET HANDLING
  async function handleRaise(formData: FormData) {
    formData.append('office_id', officeId || '')
    const response = await createTicket(formData)
    if (response.success) {
      alert('Ticket Submitted Successfully!')
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
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-gray-800 text-lg">Office {officeId}</h1>
        <div className="flex bg-gray-100 p-1 rounded-full">
          <button 
            onClick={() => setView('performance')} 
            className={`px-5 py-2 rounded-full text-xs font-bold transition ${view === 'performance' ? 'bg-white shadow-sm' : ''}`}
          >
            STATS
          </button>
          <button 
            onClick={() => setView('grievance')} 
            className={`px-5 py-2 rounded-full text-xs font-bold transition ${view === 'grievance' ? 'bg-white shadow-sm' : ''}`}
          >
            GRIEVANCE
          </button>
        </div>
      </header>

      {/* CONTENT AREA */}
      <div className="p-4 max-w-lg mx-auto mt-4">
        
        {/* PERFORMANCE VIEW */}
        {view === 'performance' ? (
          <div className="space-y-4">
            {!selectedVertical ? (
              <>
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Overall Score</p>
                  <h2 className="text-5xl font-black mt-2">88%</h2>
                </div>
                
                {structure.map((vertical) => (
                  <button 
                    key={vertical.id} 
                    onClick={() => setSelectedVertical(vertical)} 
                    className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left hover:shadow-md transition"
                  >
                    <div className="flex justify-between mb-3 font-bold text-gray-800">
                      <span>{vertical.vertical_name}</span>
                      <span>85%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[85%]" />
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <button 
                  onClick={() => setSelectedVertical(null)} 
                  className="text-blue-600 font-bold mb-6 underline"
                >
                  ← Back to Stats
                </button>
                <h3 className="font-black text-xl mb-4">{selectedVertical.vertical_name}</h3>
                
                {selectedVertical.parameters.map((parameter: any) => (
                  <div key={parameter.id} className="flex justify-between p-4 bg-gray-50 rounded-xl mb-2 font-bold text-sm">
                    {parameter.parameter_name} 
                    <span className="text-blue-600 font-black">
                      {officeData?.metrics.find((m: any) => m.parameter_id === parameter.id)?.actual_value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          
          /* GRIEVANCE VIEW */
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="font-black text-lg">Raise Grievance</h2>
            <form action={handleRaise} className="space-y-4">
              <textarea 
                name="description" 
                required 
                className="w-full border-0 p-4 rounded-xl bg-gray-50 text-sm" 
                placeholder="Type your issue here..." 
                rows={4} 
              />
              <button className="bg-blue-600 text-white w-full py-4 rounded-xl font-bold hover:bg-blue-700 transition">
                SUBMIT TICKET
              </button>
            </form>
            
            <div className="border-t pt-6">
              <form action={checkTicketStatus} className="flex gap-2">
                <input 
                  name="code" 
                  className="border-0 bg-gray-50 p-4 rounded-xl text-sm w-full" 
                  placeholder="Enter 6-digit code" 
                />
                <button className="bg-gray-800 text-white px-6 rounded-xl font-bold">
                  CHECK
                </button>
              </form>
              
              {ticketDetails && (
                <div className="mt-4 bg-gray-50 p-6 rounded-2xl text-sm space-y-2">
                  <p className="font-bold">Status: {ticketDetails.status.toUpperCase()}</p>
                  
                  {ticketDetails.status === 'closed' && (
                    <div>
                      {!isEscalating ? (
                        <button 
                          onClick={() => setIsEscalating(true)} 
                          className="text-red-600 underline font-bold text-xs mt-2"
                        >
                          Escalate to re-open?
                        </button>
                      ) : (
                        <div className="flex gap-2 mt-2">
                          <input 
                            className="border p-2 rounded-lg w-full text-xs" 
                            onChange={(e) => setEscalateReason(e.target.value)} 
                          />
                          <button 
                            onClick={handleEscalation} 
                            className="bg-red-600 text-white px-3 rounded-lg font-bold text-xs"
                          >
                            SUBMIT
                          </button>
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