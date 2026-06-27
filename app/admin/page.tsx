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
  
  // Matrix states
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)

  // Bulk Upload states
  const [file, setFile] = useState<File | null>(null)
  const [selectedParamId, setSelectedParamId] = useState('')
  const [month, setMonth] = useState('June')
  const [part, setPart] = useState('Part 1')

  async function loadData() {
    const t = await getTickets(); 
    if (t.data) setTickets(t.data); 
    const s = await getMatrixStructure(); 
    if (s.data) setStructure(s.data);
  }

  useEffect(() => { loadData() }, [])

  async function handleMove(id: string, s: string) { 
    await updateTicketStatus(id, s); 
    await loadData(); 
  }

  async function handleSubmitReply(id: string, msg: string, close: boolean) { 
    await addReply(id, msg, close); 
    await loadData(); 
  }

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
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-50 border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-gray-800">Admin Portal</h1>
        <div className="flex gap-2">
          {['matrix', 'tickets', 'bulk'].map(v => (
            <button key={v} onClick={() => setView(v as any)} className={`px-3 py-1 rounded-lg text-xs font-bold ${view === v ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>{v.toUpperCase()}</button>
          ))}
          <a href="/" className="px-3 py-1 rounded-lg text-xs font-bold text-red-600 bg-red-50">LOGOUT</a>
        </div>
      </header>

      <div className="p-4 max-w-lg mx-auto">
        {/* MATRIX VIEW */}
        {view === 'matrix' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Performance Matrix</h2>
            {!selectedVertical && structure.map(v => (
              <button key={v.id} onClick={() => setSelectedVertical(v)} className="w-full bg-white p-5 rounded-2xl shadow-sm border-l-4 border-blue-600 text-left hover:shadow-md transition">
                <span className="font-bold text-gray-800">{v.vertical_name}</span>
                <div className="w-full bg-gray-100 h-2 mt-3 rounded-full overflow-hidden"><div className="h-full bg-blue-600 w-[75%]" /></div>
              </button>
            ))}
            {selectedVertical && !selectedParam && (
              <div className="space-y-2">
                <button onClick={() => setSelectedVertical(null)} className="text-blue-600 font-bold mb-2">← Back</button>
                {selectedVertical.parameters.map((p:any) => (
                  <button key={p.id} onClick={async() => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="w-full bg-white p-4 rounded-xl shadow-sm border text-left hover:bg-gray-50">
                    {p.parameter_name}
                  </button>
                ))}
              </div>
            )}
            {selectedParam && (
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <button onClick={() => setSelectedParam(null)} className="text-blue-600 font-bold mb-4">← Back</button>
                <h3 className="font-bold text-lg mb-4">{selectedParam.parameter_name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl text-center"><p className="text-xs text-green-800 font-bold">TOP 5</p><p className="text-2xl font-black">{leaderboard?.top5?.length || 0}</p></div>
                  <div className="bg-red-50 p-4 rounded-xl text-center"><p className="text-xs text-red-800 font-bold">BOTTOM 5</p><p className="text-2xl font-black">{leaderboard?.bottom5?.length || 0}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TICKETS VIEW */}
        {view === 'tickets' && (
          <div>
            <div className="flex bg-white p-1 rounded-xl mb-4 shadow-sm border">
              {['open', 'in_progress', 'escalated', 'closed'].map(s => (
                <button key={s} onClick={() => setTicketTab(s as any)} className={`flex-1 py-2 text-[10px] font-bold rounded-lg ${ticketTab === s ? 'bg-blue-600 text-white' : ''}`}>{s.toUpperCase()}</button>
              ))}
            </div>
            {tickets.filter(t => t.status === ticketTab).map(t => (
              <div key={t.id} className="bg-white p-4 rounded-2xl shadow-sm mb-3 border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">#{t.ticket_code} • {t.offices?.office_name}</span>
                  {t.status !== 'closed' && <button onClick={() => handleSubmitReply(t.id, 'Resolved', true)} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded font-bold">Resolve</button>}
                </div>
                <p className="text-sm my-2 text-gray-700">{t.description}</p>
                {t.status === 'open' && <button onClick={() => handleMove(t.id, 'in_progress')} className="text-[10px] bg-yellow-500 text-white px-2 py-1 rounded font-bold">Start In-Progress</button>}
              </div>
            ))}
          </div>
        )}

        {/* BULK VIEW */}
        {view === 'bulk' && (
          <div className="bg-white p-8 rounded-2xl shadow-sm">
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