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
    if (t?.data) {
      setTickets(t.data)
    }
    const s = await getMatrixStructure()
    if (s?.data) {
      setStructure(s.data)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleMove(id: string, status: string) {
    await updateTicketStatus(id, status)
    await loadData()
  }

  async function handleSubmitReply(formData: FormData) {
    const id = formData.get('ticket_id') as string
    const msg = formData.get('reply') as string
    
    if (id) {
      await addReply(id, msg, true)
      await loadData()
    }
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
        if (res?.success) {
          alert('Upload successful!')
        } else {
          alert('Error: ' + (res?.error || 'Unknown'))
        }
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-50 border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.jpg" alt="Dak Connect" className="h-10 w-10 object-contain" />
          <h1 className="font-black text-gray-800 text-xl tracking-tight">Dak Connect Admin</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('matrix')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'matrix' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>MATRIX</button>
          <button onClick={() => setView('tickets')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'tickets' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>TICKETS</button>
          <button onClick={() => setView('bulk')} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${view === 'bulk' ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>BULK</button>
          <a href="/" className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 ml-2">LOGOUT</a>
        </div>
      </header>

      <div className="p-6 max-w-2xl mx-auto">
        {view === 'matrix' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900">Performance Matrix</h2>
            {!selectedVertical && !selectedParam && structure.map((v: any) => (
              <button key={v.id} onClick={() => setSelectedVertical(v)} className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-left hover:shadow-md transition">
                <p className="font-bold text-lg text-gray-800">{v.vertical_name}</p>
              </button>
            ))}
            
            {selectedVertical && !selectedParam && (
              <div className="space-y-4">
                <button onClick={() => setSelectedVertical(null)} className="text-red-600 font-bold underline mb-4 text-sm hover:text-red-700">← Back</button>
                {selectedVertical.parameters?.map((p: any) => (
                  <button key={p.id} onClick={async () => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-100 text-left font-bold text-gray-700 hover:bg-yellow-50 transition">{p.parameter_name}</button>
                ))}
              </div>
            )}

            {selectedParam && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <button onClick={() => setSelectedParam(null)} className="text-red-600 font-bold underline mb-6 text-sm hover:text-red-700">← Back</button>
                <h3 className="font-black text-2xl mb-6 text-gray-900">{selectedParam.parameter_name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center shadow-inner">
                    <p className="text-xs text-green-700 font-bold tracking-widest uppercase">TOP 5</p>
                    <p className="text-4xl font-black text-green-900 mt-2">{(leaderboard as any)?.top5?.length || 0}</p>
                  </div>
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center shadow-inner">
                    <p className="text-xs text-red-700 font-bold tracking-widest uppercase">BOTTOM 5</p>
                    <p className="text-4xl font-black text-red-900 mt-2">{(leaderboard as any)?.bottom5?.length || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'tickets' && (
          <div>
            <div className="flex bg-white p-1 rounded-2xl mb-6 shadow-sm border border-gray-100">
              {['open', 'in_progress', 'escalated', 'closed'].map((s) => (
                <button key={s} onClick={() => setTicketTab(s as any)} className={`flex-1 py-3 text-xs font-black rounded-xl uppercase transition ${ticketTab === s ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
            
            {tickets.filter((t: any) => t.status === ticketTab).map((t: any) => (
              <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-4 hover:shadow-md transition">
                <div className="flex justify-between items-center mb-4 border-b border-gray-50 pb-4">
                  <span className="text-xs font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg tracking-widest">#{t.ticket_code}</span>
                  <span className="text-sm font-black text-red-700 bg-red-50 px-3 py-1.5 rounded-lg">{t.offices?.office_name || t.office_id}</span>
                </div>
                
                <p className="text-sm text-gray-800 mb-6 leading-relaxed font-medium">{t.description}</p>
                
                {t.status === 'open' && (
                  <button onClick={() => handleMove(t.id, 'in_progress')} className="w-full py-4 bg-gray-900 text-white text-xs font-black rounded-xl hover:bg-gray-800 transition shadow-md active:scale-95 tracking-widest uppercase">
                    Start Progress
                  </button>
                )}
                
                {(t.status === 'in_progress' || t.status === 'escalated') && (
                  <form action={handleSubmitReply} className="mt-4 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <input type="hidden" name="ticket_id" value={t.id} />
                    <textarea 
                      name="reply" 
                      required 
                      placeholder="Type resolution here..." 
                      className="w-full border-0 p-4 rounded-xl bg-white text-sm shadow-sm outline-none focus:ring-2 focus:ring-red-200"
                      rows={3}
                    />
                    <button type="submit" className="w-full py-3 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-red-700 transition shadow-md active:scale-95 tracking-widest uppercase">
                      Resolve Ticket
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'bulk' && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-black mb-6 text-gray-900">Bulk Import Data</h2>
            <div className="space-y-4">
              <select className="w-full bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-red-200" onChange={(e) => setSelectedParamId(e.target.value)}>
                <option value="">Select Parameter</option>
                {structure.map((v: any) => (
                  <optgroup key={v.id} label={v.vertical_name}>
                    {v.parameters?.map((p: any) => <option key={p.id} value={p.id}>{p.parameter_name}</option>)}
                  </optgroup>
                ))}
              </select>
              
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-red-200" onChange={(e) => setMonth(e.target.value)}>
                  <option>June</option>
                  <option>July</option>
                </select>
                <select className="bg-gray-50 border-0 p-4 rounded-xl font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-red-200" onChange={(e) => setPart(e.target.value)}>
                  <option>Part 1</option>
                  <option>Part 2</option>
                  <option>Part 3</option>
                </select>
              </div>
              
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 text-center hover:bg-gray-100 transition cursor-pointer">
                <input type="file" accept=".csv" className="w-full text-sm font-bold text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
              
              <button onClick={handleUpload} className="w-full py-4 mt-2 bg-red-600 text-white rounded-xl font-black shadow-lg hover:bg-red-700 transition active:scale-95 tracking-widest uppercase">
                PROCESS UPLOAD
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}