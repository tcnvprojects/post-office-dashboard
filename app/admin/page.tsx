'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'
import { bulkUpdateMetrics } from '@/app/actions/admin-bulk'

export default function AdminDashboard() {
  const [view, setView] = useState<'matrix' | 'tickets' | 'bulk'>('matrix')
  const [ticketTab, setTicketTab] = useState<'open' | 'in_progress' | 'escalated' | 'closed'>('open')
  
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [selectedParamId, setSelectedParamId] = useState('')
  const [month, setMonth] = useState('June')
  const [part, setPart] = useState('Part 1')

  async function loadData() {
    const t = await getTickets()
    if (t.data) {
      setTickets(t.data)
    }
    const s = await getMatrixStructure()
    if (s.data) {
      setStructure(s.data)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleMove(id: string, s: string) {
    await updateTicketStatus(id, s)
    await loadData()
  }

  async function handleSubmitReply(id: string, msg: string, close: boolean) {
    await addReply(id, msg, close)
    await loadData()
  }

  async function handleUpload() {
    if (!file || !selectedParamId) {
      alert('Select a file and a parameter')
      return
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await bulkUpdateMetrics(results.data, selectedParamId, month, part)
        if (res.success) {
          alert('Upload successful!')
        } else {
          alert('Error: ' + res.error)
        }
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-50 border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-gray-800 text-lg">Admin Portal</h1>
        <div className="flex gap-2">
          <button onClick={() => setView('matrix')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'matrix' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100'}`}>MATRIX</button>
          <button onClick={() => setView('tickets')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'tickets' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100'}`}>TICKETS</button>
          <button onClick={() => setView('bulk')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'bulk' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100'}`}>BULK</button>
          <a href="/" className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100">LOGOUT</a>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        {view === 'matrix' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Performance Matrix</h2>
            {!selectedVertical && !selectedParam && structure.map((v) => (
              <button key={v.id} onClick={() => setSelectedVertical(v)} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left hover:shadow-md transition">
                <p className="font-bold text-lg text-gray-800">{v.vertical_name}</p>
                <div className="w-full bg-gray-100 h-2 mt-4 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 w-[75%] rounded-full" />
                </div>
              </button>
            ))}
            
            {selectedVertical && !selectedParam && (
              <div className="space-y-4">
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 font-bold underline mb-4">← Back to Verticals</button>
                {selectedVertical.parameters.map((p: any) => (
                  <button key={p.id} onClick={async () => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="w-full bg-white p-5 rounded-2xl shadow-sm border text-left font-bold text-gray-700 hover:bg-gray-50 transition">
                    {p.parameter_name}
                  </button>
                ))}
              </div>
            )}

            {selectedParam && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border">
                <button onClick={() => setSelectedParam(null)} className="text-blue-600 font-bold underline mb-6">← Back to Parameters</button>
                <h3 className="font-black text-2xl mb-6">{selectedParam.parameter_name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center">
                    <p className="text-xs text-green-700 font-bold">TOP 5</p>
                    <p className="text-4xl font-black text-green-900">{leaderboard?.top5?.length || 0}</p>
                  </div>
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center">
                    <p className="text-xs text-red-700 font-bold">BOTTOM 5</p>
                    <p className="text-4xl font-black text-red-900">{leaderboard?.bottom5?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'tickets' && (
          <div>
            <div className="flex bg-white p-1 rounded-2xl mb-6 shadow-sm border">
              {['open', 'in_progress', 'escalated', 'closed'].map((s) => (
                <button key={s} onClick={() => setTicketTab(s as any)} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition ${ticketTab === s ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}>
                  {s}
                </button>
              ))}
            </div>
            {tickets.filter((t) => t.status === ticketTab).map((t) => (
              <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">#{t.ticket_code}</span>
                  <span className="text-xs font-bold text-blue-600">{t.offices?.office_name}</span>
                </div>
                <p className="text-sm text-gray-700 mb-6">{t.description}</p>
                {t.status === 'open' && (
                  <button onClick={() => handleMove(t.id, 'in_progress')} className="w-full py-3 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition">
                    START PROGRESS
                  </button>
                )}
                {t.status !== 'closed' && (
                  <button onClick={() => handleSubmitReply(t.id, 'Resolved', true)} className="w-full py-3 mt-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition">
                    RESOLVE TICKET
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'bulk' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <h2 className="text-xl font-black mb-6">Bulk Import Data</h2>
            <div className="space-y-4">
              <select className="w-full bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm" onChange={(e) => setSelectedParamId(e.target.value)}>
                <option value="">Select Parameter</option>
                {structure.map((v) => (
                  <optgroup key={v.id} label={v.vertical_name}>
                    {v.parameters.map((p: any) => <option key={p.id} value={p.id}>{p.parameter_name}</option>)}
                  </optgroup>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className="bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm" onChange={(e) => setMonth(e.target.value)}>
                  <option>June</option><option>July</option>
                </select>
                <select className="bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm" onChange={(e) => setPart(e.target.value)}>
                  <option>Part 1</option><option>Part 2</option><option>Part 3</option>
                </select>
              </div>
              <input type="file" accept=".csv" className="w-full p-4 bg-gray-50 rounded-xl text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <button onClick={handleUpload} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">PROCESS UPLOAD</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}