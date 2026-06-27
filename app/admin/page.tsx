'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'

// --- TICKET CARD COMPONENT (Keep exactly as before) ---
const TicketCard = ({ ticket, handleMove, replyingTo, setReplyingTo, replyMessage, setReplyMessage, handleSubmitReply }: any) => (
  // ... (Paste your existing TicketCard component code here to save space)
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
      {/* existing ticket card code */}
      <h3 className="font-semibold text-gray-800 text-sm">{ticket.offices?.office_name}</h3>
  </div>
)

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')

  // --- Tickets State ---
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')

  // --- Performance State ---
  const [structure, setStructure] = useState<any[]>([])
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<{ top5: any[], bottom5: any[] } | null>(null)

  useEffect(() => {
    async function loadInitialData() {
      // Load Tickets
      const ticketResult = await getTickets()
      if (ticketResult.data) setTickets(ticketResult.data)
      setLoading(false)

      // Load Matrix Structure
      const matrixResult = await getMatrixStructure()
      if (matrixResult.data) setStructure(matrixResult.data)
    }
    loadInitialData()
  }, [])

  // --- Ticket Actions ---
  async function handleMove(ticketId: string, newStatus: string) {
    await updateTicketStatus(ticketId, newStatus)
    const result = await getTickets()
    if (result.data) setTickets(result.data)
  }
  async function handleSubmitReply(ticketId: string, closeTicket: boolean) {
    if (!replyMessage.trim()) return
    await addReply(ticketId, replyMessage, closeTicket)
    setReplyingTo(null); setReplyMessage('')
    const result = await getTickets()
    if (result.data) setTickets(result.data)
  }

  // --- Performance Actions ---
  async function handleParamClick(param: any) {
    setSelectedParam(param)
    setLeaderboard(null)
    const result = await getParameterLeaderboard(param.id)
    setLeaderboard(result)
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b pb-4">
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`text-2xl font-bold px-4 py-2 rounded-lg transition ${activeTab === 'tickets' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Ticket Board
          </button>
          <button 
            onClick={() => setActiveTab('performance')}
            className={`text-2xl font-bold px-4 py-2 rounded-lg transition ${activeTab === 'performance' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            Assessment Matrix
          </button>
        </div>
        
        {/* --- TICKETS VIEW --- */}
        {activeTab === 'tickets' && (
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {/* Your 4 Kanban columns go here exactly as they were */}
             <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
               <h2 className="font-semibold text-gray-700 mb-4">Tickets will render here...</h2>
             </div>
           </div>
        )}

        {/* --- PERFORMANCE VIEW --- */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-3xl shadow-sm border p-8">
            
            {/* Level 1: Verticals */}
            {!selectedVertical && !selectedParam && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Vertical</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {structure.map((v) => (
                    <div 
                      key={v.id} onClick={() => setSelectedVertical(v)}
                      className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition"
                    >
                      <h3 className="text-xl font-bold text-gray-800">{v.vertical_name}</h3>
                      <p className="text-gray-500 mt-2">{v.parameters.length} Parameters</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Level 2: Parameters within a Vertical */}
            {selectedVertical && !selectedParam && (
              <div>
                <button onClick={() => setSelectedVertical(null)} className="mb-6 font-semibold text-blue-600 hover:underline">← Back to Verticals</button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{selectedVertical.vertical_name} Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedVertical.parameters.map((p: any) => (
                    <div 
                      key={p.id} onClick={() => handleParamClick(p)}
                      className="bg-white border rounded-xl p-5 cursor-pointer hover:shadow-lg transition"
                    >
                      <p className="font-bold text-gray-800 text-lg">{p.parameter_name}</p>
                      <p className="text-sm text-gray-500 mt-2">Target: {p.target_value ? `${p.target_value} ${p.target_unit}` : p.description}</p>
                      <div className="mt-4 text-sm text-blue-600 font-bold bg-blue-50 py-1 px-3 rounded inline-block">View Leaderboard →</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Level 3: Leaderboard (Top 5 / Bottom 5) */}
            {selectedParam && (
              <div>
                <button onClick={() => { setSelectedParam(null); setLeaderboard(null); }} className="mb-6 font-semibold text-blue-600 hover:underline">← Back to Parameters</button>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedParam.parameter_name}</h2>
                <p className="text-gray-500 mb-8">Target: {selectedParam.target_value ? `${selectedParam.target_value} ${selectedParam.target_unit}` : selectedParam.description}</p>
                
                {!leaderboard ? (
                   <p className="text-gray-500 italic">Calculating rankings...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Top 5 */}
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-green-800 mb-4">🏆 Top 5 Offices</h3>
                      {leaderboard.top5.length === 0 ? <p className="text-gray-500 text-sm">No data recorded yet.</p> : (
                        <div className="space-y-3">
                          {leaderboard.top5.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                              <div>
                                <span className="font-bold text-gray-800">{idx + 1}. {m.offices.office_name}</span>
                                <span className="block text-xs text-gray-400">ID: {m.offices.office_id}</span>
                              </div>
                              <span className="font-black text-green-600 text-lg">{m.actual_value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom 5 */}
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-red-800 mb-4">⚠️ Bottom 5 Offices</h3>
                      {leaderboard.bottom5.length === 0 ? <p className="text-gray-500 text-sm">No data recorded yet.</p> : (
                        <div className="space-y-3">
                          {leaderboard.bottom5.map((m: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                              <div>
                                <span className="font-bold text-gray-800">{leaderboard!.bottom5.length - idx}. {m.offices.office_name}</span>
                                <span className="block text-xs text-gray-400">ID: {m.offices.office_id}</span>
                              </div>
                              <span className="font-black text-red-600 text-lg">{m.actual_value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}