'use client'
// Add this line here
export const dynamic = 'force-dynamic'
import { useRef, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createTicket, getTicketStatus, escalateTicket } from '@/app/actions/tickets'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

export default function StaffDashboard() {
  const searchParams = useSearchParams()
  const officeId = searchParams.get('office_id')

  // --- Performance State ---
  const [structure, setStructure] = useState<any[]>([])
  const [officeData, setOfficeData] = useState<{ office: any, metrics: any[] } | null>(null)
  const [perfLoading, setPerfLoading] = useState(false)
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)

  // --- Ticket State ---
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

  // Auto-load data on mount
  useEffect(() => {
    async function loadData() {
      // 1. Load Matrix Structure
      const structRes = await getMatrixStructure()
      if (structRes.data) setStructure(structRes.data)

      // 2. Auto-load Performance if officeId is present
      if (officeId) {
        setPerfLoading(true)
        const perfRes = await getOfficeMetrics(Number(officeId))
        if (!perfRes.error) setOfficeData(perfRes as any)
        setPerfLoading(false)
      }
    }
    loadData()
  }, [officeId])

  // --- Logic Functions ---
  async function handleRaiseSubmit(formData: FormData) {
    setRaiseLoading(true); setRaiseBanner(null)
    formData.append('office_id', officeId || '') // Ensure office ID is sent
    const result = await createTicket(formData)
    setRaiseLoading(false)
    if ('error' in result && result.error) return setRaiseBanner({ type: 'error', message: result.error })
    setRaiseBanner({ type: 'success', message: `Ticket ${result.ticketCode} generated.` })
    raiseFormRef.current?.reset()
  }

  async function handleStatusSubmit(formData: FormData) {
    setStatusLoading(true); setStatusError(null); setTicketDetails(null)
    const result = await getTicketStatus(Number(formData.get('ticket_code')))
    setStatusLoading(false)
    if (result.error) return setStatusError(result.error)
    setTicketDetails(result.data)
  }

  // --- Render Helpers ---
  const getMetricValue = (paramId: string) => {
    if (!officeData) return 'N/A'
    const metric = officeData.metrics.find((m: any) => m.parameter_id === paramId)
    return metric ? metric.actual_value : '—'
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6 pb-20">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">Office {officeId} Dashboard</h1>
          <a href="/" className="text-sm text-gray-500 hover:underline">Logout</a>
        </header>

        {/* PERFORMANCE SECTION */}
        <section className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Assessment Matrix</h2>
          {perfLoading ? <p>Loading data...</p> : (
            <>
              {!selectedVertical ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {structure.map((v) => (
                    <button key={v.id} onClick={() => setSelectedVertical(v)} className="bg-blue-50 hover:bg-blue-100 p-4 rounded-xl text-center transition">
                      <p className="font-bold text-blue-900">{v.vertical_name}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <button onClick={() => setSelectedVertical(null)} className="text-sm text-blue-600 mb-4">← Back</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedVertical.parameters.map((p: any) => (
                      <div key={p.id} className="border p-3 rounded-lg flex justify-between">
                        <span className="text-sm font-medium">{p.parameter_name}</span>
                        <span className="font-bold text-blue-600">{getMetricValue(p.id)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* TICKETING SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Raise Grievance</h2>
            <form ref={raiseFormRef} action={handleRaiseSubmit} className="space-y-3">
              <textarea name="description" required rows={3} placeholder="Describe issue..." className="w-full border rounded-lg p-2" />
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Submit Ticket</button>
            </form>
            {raiseBanner && <p className="mt-2 text-sm text-green-600">{raiseBanner.message}</p>}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-bold mb-4">Check Status</h2>
            <form action={handleStatusSubmit} className="flex gap-2">
              <input name="ticket_code" type="number" placeholder="6-digit code" className="w-full border rounded-lg p-2" />
              <button className="bg-gray-800 text-white px-4 py-2 rounded-lg">Check</button>
            </form>
            {ticketDetails && <div className="mt-4 p-3 bg-gray-50 rounded text-sm">Status: {ticketDetails.status}</div>}
          </div>
        </div>
      </div>
    </main>
  )
}