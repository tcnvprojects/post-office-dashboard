'use client'

import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'
import { bulkUpdateMetrics } from '@/app/actions/admin-bulk'

const TicketCard = ({ ticket, handleMove, handleSubmitReply }: any) => {
  const [isReplying, setIsReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
      <div className="flex justify-between text-xs font-bold mb-1">
        <span>#{ticket.ticket_code}</span>
        <span>{ticket.offices?.office_name} ({ticket.offices?.office_id})</span>
      </div>
      <p className="text-sm mb-3">{ticket.description}</p>
      <div className="flex gap-1 flex-wrap">
        {ticket.status === 'open' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-[10px] bg-yellow-100 p-1 rounded font-bold">In-Prog</button>}
        {ticket.status !== 'closed' && <button onClick={() => setIsReplying(!isReplying)} className="text-[10px] bg-blue-600 text-white p-1 rounded font-bold">Reply</button>}
      </div>
      {isReplying && (
        <div className="mt-3 pt-3 border-t">
          <textarea className="w-full border p-1 text-xs" onChange={(e) => setReplyText(e.target.value)} />
          <button onClick={() => { handleSubmitReply(ticket.id, replyText, true); setIsReplying(false); }} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded mt-1">Reply & Close</button>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance' | 'bulk'>('tickets')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [selectedParamId, setSelectedParamId] = useState('')
  const [month, setMonth] = useState('June')
  const [week, setWeek] = useState('Week 1')

  async function loadData() {
    const t = await getTickets(); if (t.data) setTickets(t.data)
    const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
  }

  useEffect(() => { loadData() }, [])

  async function handleMove(id: string, s: string) { await updateTicketStatus(id, s); await loadData() }
  async function handleSubmitReply(id: string, msg: string, close: boolean) { await addReply(id, msg, close); await loadData() }

  async function handleUpload() {
    if (!file || !selectedParamId) return alert('Select a file and a parameter')
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const res = await bulkUpdateMetrics(results.data, selectedParamId, month, week)
        if (res.success) alert('Upload successful!')
        else alert('Error: ' + res.error)
      }
    })
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">Admin Portal</h1><a href="/" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Logout</a></div>
      
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button onClick={() => setActiveTab('tickets')} className={`font-bold p-2 ${activeTab === 'tickets' ? 'border-b-2 border-black' : ''}`}>Tickets</button>
        <button onClick={() => setActiveTab('performance')} className={`font-bold p-2 ${activeTab === 'performance' ? 'border-b-2 border-black' : ''}`}>Matrix</button>
        <button onClick={() => setActiveTab('bulk')} className={`font-bold p-2 ${activeTab === 'bulk' ? 'border-b-2 border-black' : ''}`}>Bulk Upload</button>
      </div>

      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-4 gap-4">
          {['escalated', 'open', 'in_progress', 'closed'].map(s => (
            <div key={s} className="bg-gray-200 p-4 rounded-xl">
              <h2 className="font-bold uppercase text-xs mb-4">{s} ({tickets.filter(t => t.status === s).length})</h2>
              {tickets.filter(t => t.status === s).map(t => <TicketCard key={t.id} ticket={t} handleMove={handleMove} handleSubmitReply={handleSubmitReply} />)}
            </div>
          ))}
        </div>
      ) : activeTab === 'performance' ? (
        <div className="bg-white p-6 rounded-xl">
          {!selectedVertical && !selectedParam && structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="block w-full text-left p-4 border rounded-xl mb-2 font-bold hover:bg-gray-50">{v.vertical_name}</button>)}
          {selectedVertical && !selectedParam && <div><button onClick={() => setSelectedVertical(null)} className="text-blue-600 underline mb-4">← Back</button>
            {selectedVertical.parameters.map((p:any) => <button key={p.id} onClick={async() => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="block border-b w-full p-3 font-semibold text-left">{p.parameter_name}</button>)}</div>}
          {selectedParam && <div><button onClick={() => setSelectedParam(null)} className="text-blue-600 underline mb-4">← Back to Params</button>
            <h2 className="text-xl font-bold">{selectedParam.parameter_name}</h2>
            <div className="flex gap-4 mt-4"><div className="bg-green-100 p-4 rounded w-1/2">Top 5 Offices: {leaderboard?.top5?.length || 0}</div><div className="bg-red-100 p-4 rounded w-1/2">Bottom 5 Offices: {leaderboard?.bottom5?.length || 0}</div></div></div>}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm max-w-lg">
          <h2 className="text-xl font-bold mb-4">Bulk Import CSV</h2>
          <div className="space-y-4">
            <select className="w-full border p-2 rounded" onChange={(e) => setSelectedParamId(e.target.value)}>
              <option value="">Select Parameter</option>
              {structure.map(v => <optgroup key={v.id} label={v.vertical_name}>{v.parameters.map((p: any) => <option key={p.id} value={p.id}>{p.parameter_name}</option>)}</optgroup>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <select className="border p-2 rounded" onChange={(e) => setMonth(e.target.value)}><option>June</option><option>July</option></select>
              <select className="border p-2 rounded" onChange={(e) => setWeek(e.target.value)}><option>Week 1</option><option>Week 2</option><option>Week 3</option><option>Week 4</option></select>
            </div>
            <input type="file" accept=".csv" className="w-full border p-2 rounded" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <button onClick={handleUpload} className="bg-blue-600 text-white w-full py-2 mt-6 rounded-lg font-bold">Process Upload</button>
        </div>
      )}
    </main>
  )
}