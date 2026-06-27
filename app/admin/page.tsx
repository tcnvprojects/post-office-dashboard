'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'
import { bulkUpdateMetrics } from '@/app/actions/admin-bulk'

export default function AdminDashboard() {
  const [view, setView] = useState<'matrix' | 'tickets' | 'bulk'>('matrix')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  
  // Matrix Drilldown States
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)

  // Bulk Upload States
  const [file, setFile] = useState<File | null>(null)
  const [selectedParamId, setSelectedParamId] = useState('')
  const [month, setMonth] = useState('June')
  const [part, setPart] = useState('Part 1')

  async function loadData() {
    const t = await getTickets(); if (t.data) setTickets(t.data)
    const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
  }

  useEffect(() => { loadData() }, [])

  // Admin Actions
  async function handleMove(id: string, s: string) { await updateTicketStatus(id, s); await loadData() }
  async function handleSubmitReply(id: string, msg: string, close: boolean) { await addReply(id, msg, close); await loadData() }
  async function handleUpload() {
    if (!file || !selectedParamId) return alert('Select a file and a parameter')
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const res = await bulkUpdateMetrics(results.data, selectedParamId, month, part)
        if (res.success) alert('Upload successful!')
        else alert('Error: ' + res.error)
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg">Admin Portal</h1>
        <div className="flex gap-4">
          <button onClick={() => setView('matrix')} className={`text-sm font-bold ${view === 'matrix' ? 'text-blue-600' : 'text-gray-600'}`}>Matrix</button>
          <button onClick={() => setView('tickets')} className={`text-sm font-bold ${view === 'tickets' ? 'text-blue-600' : 'text-gray-600'}`}>Tickets</button>
          <button onClick={() => setView('bulk')} className={`text-sm font-bold ${view === 'bulk' ? 'text-blue-600' : 'text-gray-600'}`}>Bulk Upload</button>
          <a href="/" className="text-sm font-bold text-red-600">Logout</a>
        </div>
      </header>

      <div className="p-6">
        {/* Matrix View */}
        {view === 'matrix' && (
          <div className="bg-white p-6 rounded-xl shadow max-w-4xl mx-auto">
            {!selectedVertical && !selectedParam && (
              <>
                <h2 className="font-bold text-xl mb-4">Assessment Matrix</h2>
                {structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="block w-full text-left p-4 border rounded-xl mb-2 font-bold hover:bg-gray-50">{v.vertical_name}</button>)}
              </>
            )}
            {selectedVertical && !selectedParam && (
              <div>
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 underline mb-4">← Back to Verticals</button>
                {selectedVertical.parameters.map((p:any) => <button key={p.id} onClick={async() => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="block border-b w-full p-3 font-semibold text-left hover:bg-gray-50">{p.parameter_name}</button>)}
              </div>
            )}
            {selectedParam && (
              <div>
                <button onClick={() => setSelectedParam(null)} className="text-blue-600 underline mb-4">← Back to Parameters</button>
                <h2 className="text-xl font-bold mb-4">{selectedParam.parameter_name}</h2>
                <div className="flex gap-4">
                  <div className="bg-green-50 p-4 rounded w-1/2 border border-green-200">
                    <p className="text-sm font-bold text-green-800">Top 5 Offices</p>
                    <p className="text-2xl font-bold">{leaderboard?.top5?.length || 0}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded w-1/2 border border-red-200">
                    <p className="text-sm font-bold text-red-800">Bottom 5 Offices</p>
                    <p className="text-2xl font-bold">{leaderboard?.bottom5?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tickets View */}
        {view === 'tickets' && (
          <div className="grid grid-cols-4 gap-4">
            {['escalated', 'open', 'in_progress', 'closed'].map(s => (
              <div key={s} className="bg-gray-200 p-4 rounded-xl">
                <h2 className="font-bold uppercase text-xs mb-4">{s} ({tickets.filter(t => t.status === s).length})</h2>
                {tickets.filter(t => t.status === s).map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-xl shadow-sm border mb-4">
                    <div className="flex justify-between text-xs font-bold mb-1"><span>#{t.ticket_code}</span><span>{t.offices?.office_name}</span></div>
                    <p className="text-sm mb-3">{t.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      {t.status === 'open' && <button onClick={() => handleMove(t.id, 'in_progress')} className="text-[10px] bg-yellow-100 p-1 rounded font-bold">In-Prog</button>}
                      {t.status !== 'closed' && <button onClick={() => handleSubmitReply(t.id, 'Closing as resolved', true)} className="text-[10px] bg-green-600 text-white p-1 rounded font-bold">Resolve</button>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Bulk Upload View */}
        {view === 'bulk' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4">Bulk Import CSV</h2>
            <div className="space-y-4">
              <select className="w-full border p-2 rounded" onChange={(e) => setSelectedParamId(e.target.value)}>
                <option value="">Select Parameter</option>
                {structure.map(v => <optgroup key={v.id} label={v.vertical_name}>{v.parameters.map((p: any) => <option key={p.id} value={p.id}>{p.parameter_name}</option>)}</optgroup>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select className="border p-2 rounded" onChange={(e) => setMonth(e.target.value)}><option>June</option><option>July</option></select>
                <select className="border p-2 rounded" onChange={(e) => setPart(e.target.value)}><option>Part 1</option><option>Part 2</option><option>Part 3</option></select>
              </div>
              <input type="file" accept=".csv" className="w-full border p-2 rounded" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <button onClick={handleUpload} className="bg-blue-600 text-white w-full py-2 mt-6 rounded-lg font-bold">Process Upload</button>
          </div>
        )}
      </div>
    </main>
  )
}