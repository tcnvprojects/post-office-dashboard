'use client'

import { useRef, useState, useEffect } from 'react'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

export default function StaffDashboard() {
  // Ticketing State
  const raiseFormRef = useRef<HTMLFormElement>(null)
  const [raiseLoading, setRaiseLoading] = useState(false)
  const [raiseBanner, setRaiseBanner] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  
  const statusFormRef = useRef<HTMLFormElement>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [ticketDetails, setTicketDetails] = useState<any | null>(null)
  const [isEscalating, setIsEscalating] = useState(false)
  const [escalateReason, setEscalateReason] = useState('')
  const [escalateLoading, setEscalateLoading] = useState(false)

  // Performance State
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<{ office: any, metrics: any[] } | null>(null)
  const [perfOfficeId, setPerfOfficeId] = useState('')
  const [perfLoading, setPerfLoading] = useState(false)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)

  useEffect(() => {
    // Load matrix structure on mount
    getMatrixStructure().then(res => {
      if (res.data) setStructure(res.data)
    })
  }, [])

  // --- Ticket Functions ---
  async function handleRaiseSubmit(formData: FormData) {
    setRaiseLoading(true); setRaiseBanner(null)
    const result = await createTicket(formData)
    setRaiseLoading(false)
    if ('error' in result && result.error) return setRaiseBanner({ type: 'error', message: result.error })
    setRaiseBanner({ type: 'success', message: `Ticket ${result.ticketCode} generated. Pls await reply` })
    raiseFormRef.current?.reset()
  }

  async function handleStatusSubmit(formData: FormData) {
    setStatusLoading(true); setStatusError(null); setTicketDetails(null); setIsEscalating(false)
    const codeStr = formData.get('ticket_code')?.toString().trim()
    if (!codeStr) return setStatusError('Please enter a ticket code.'), setStatusLoading(false)
    const result = await getTicketStatus(Number(codeStr))
    setStatusLoading(false)
    if (result.error) return setStatusError(result.error)
    setTicketDetails(result.data)
  }

  async function handleEscalate() {
    if (!escalateReason.trim()) return
    setEscalateLoading(true)
    await escalateTicket(ticketDetails.id, escalateReason)
    const result = await getTicketStatus(ticketDetails.ticket_code)
    if (result.data) setTicketDetails(result.data)
    setEscalateLoading(false); setIsEscalating(false); setEscalateReason('')
  }

  // --- Performance Functions ---
  async function fetchOfficePerformance() {
    if (!perfOfficeId) return
    setPerfLoading(true)
    const result = await getOfficeMetrics(Number(perfOfficeId))
    if (!result.error) {
      setOfficeData(result as any)
      setSelectedVertical(null)
    } else {
      alert(result.error)
    }
    setPerfLoading(false)
  }

  // Helper to find a specific metric value
  const getMetricValue = (paramId: string) => {
    if (!officeData) return 'N/A'
    const metric = officeData.metrics.find(m => m.parameter_id === paramId)
    return metric ? metric.actual_value : 'No Data'
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Staff Dashboard</h1>
        
        {/* NEW: Performance Assessment Matrix */}
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">Branch Office Assessment Matrix</h2>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="Enter Office ID" 
                className="border rounded-lg px-3 py-1 text-sm outline-none"
                value={perfOfficeId}
                onChange={(e) => setPerfOfficeId(e.target.value)}
              />
              <button 
                onClick={fetchOfficePerformance}
                disabled={perfLoading}
                className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {perfLoading ? 'Loading...' : 'Load Matrix'}
              </button>
            </div>
          </div>

          {officeData && !selectedVertical && (
            <div>
              <p className="text-gray-600 mb-4 font-medium">Viewing performance for: <span className="text-gray-900 font-bold">{officeData.office.office_name}</span></p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {structure.map((vertical) => (
                  <div 
                    key={vertical.id} 
                    onClick={() => setSelectedVertical(vertical)}
                    className="rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-500 hover:shadow-md transition bg-gray-50 text-center"
                  >
                    <h3 className="font-bold text-lg text-gray-800">{vertical.vertical_name}</h3>
                    <p className="text-sm text-gray-500 mt-2">Click to view {vertical.parameters.length} parameters</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedVertical && (
            <div>
              <button onClick={() => setSelectedVertical(null)} className="text-sm text-blue-600 hover:underline mb-4 font-semibold">
                ← Back to Verticals
              </button>
              <h3 className="font-bold text-xl text-gray-800 mb-4">{selectedVertical.vertical_name} Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedVertical.parameters.map((param: any) => (
                  <div key={param.id} className="bg-white border rounded-lg p-4 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-700">{param.parameter_name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Target: {param.target_value ? `${param.target_value} ${param.target_unit}` : param.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-black text-blue-700">
                        {getMetricValue(param.id)}
                      </span>
                      <span className="text-xs text-gray-400">Actual</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!officeData && !perfLoading && (
            <div className="text-center text-gray-400 py-8 italic">Enter your Office ID to load the Assessment Matrix.</div>
          )}
        </div>

        {/* Existing Ticketing Code below... */}
        {/* You can leave your exact HTML for the Raise Ticket and Check Status grids here */}
      </div>
    </main>
  )
}