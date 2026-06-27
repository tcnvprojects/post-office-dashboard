'use client'

import { useEffect, useState } from 'react'
import { getTickets, updateTicketStatus, addReply } from '@/app/actions/admin-tickets'
import { getMatrixStructure, getParameterLeaderboard } from '@/app/actions/performance'

const TicketCard = ({ ticket, handleMove, handleSubmitReply }: any) => {
  const [isReplying, setIsReplying] = useState(false)
  const [msg, setMsg] = useState('')
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border mb-4">
      <div className="flex justify-between text-xs font-bold mb-1"><span>#{ticket.ticket_code}</span><span>{ticket.offices?.office_name}</span></div>
      <p className="text-sm mb-3">{ticket.description}</p>
      <div className="flex gap-1 flex-wrap">
        {ticket.status === 'open' && <button onClick={() => handleMove(ticket.id, 'in_progress')} className="text-[10px] bg-yellow-100 p-1 rounded font-bold">In-Prog</button>}
        {ticket.status !== 'closed' && <button onClick={() => setIsReplying(!isReplying)} className="text-[10px] bg-blue-600 text-white p-1 rounded font-bold">Reply</button>}
      </div>
      {isReplying && (
        <div className="mt-3 pt-3 border-t"><textarea className="w-full border p-1 text-xs" onChange={(e) => setMsg(e.target.value)} />
          <button onClick={() => { handleSubmitReply(ticket.id, msg, true); setIsReplying(false); }} className="text-[10px] bg-green-600 text-white px-2 py-1 rounded mt-1">Reply & Close</button>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tickets' | 'performance'>('tickets')
  const [tickets, setTickets] = useState<any[]>([])
  const [structure, setStructure] = useState<any[]>([])
  const [selectedVertical, setSelectedVertical] = useState<any | null>(null)
  const [selectedParam, setSelectedParam] = useState<any | null>(null)
  const [leaderboard, setLeaderboard] = useState<any | null>(null)

  async function loadData() {
    const t = await getTickets(); if (t.data) setTickets(t.data)
    const s = await getMatrixStructure(); if (s.data) setStructure(s.data)
  }

  useEffect(() => { loadData() }, [])

  async function handleMove(id: string, s: string) { await updateTicketStatus(id, s); await loadData() }
  async function handleSubmitReply(id: string, msg: string, close: boolean) { await addReply(id, msg, close); await loadData() }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between mb-8"><h1 className="text-2xl font-bold">Admin Portal</h1><a href="/" className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Logout</a></div>
      <div className="flex gap-4 mb-6 border-b"><button onClick={() => setActiveTab('tickets')} className={`font-bold p-2 ${activeTab === 'tickets' ? 'border-b-2 border-black' : ''}`}>Tickets</button><button onClick={() => setActiveTab('performance')} className={`font-bold p-2 ${activeTab === 'performance' ? 'border-b-2 border-black' : ''}`}>Matrix</button></div>
      
      {activeTab === 'tickets' ? (
        <div className="grid grid-cols-4 gap-4">
          {['escalated', 'open', 'in_progress', 'closed'].map(s => (
            <div key={s} className="bg-gray-200 p-4 rounded-xl">
              <h2 className="font-bold uppercase text-xs mb-4">{s}</h2>
              {tickets.filter(t => t.status === s).map(t => <TicketCard key={t.id} ticket={t} handleMove={handleMove} handleSubmitReply={handleSubmitReply} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl">
          {!selectedVertical && !selectedParam && structure.map(v => <button key={v.id} onClick={() => setSelectedVertical(v)} className="block w-full text-left p-4 border rounded-xl mb-2 font-bold">{v.vertical_name}</button>)}
          {selectedVertical && !selectedParam && <div><button onClick={() => setSelectedVertical(null)} className="text-blue-600 underline mb-4">← Back</button>
            {selectedVertical.parameters.map((p:any) => <button key={p.id} onClick={async() => { setSelectedParam(p); const l = await getParameterLeaderboard(p.id); setLeaderboard(l); }} className="block border-b w-full p-3 font-semibold text-left">{p.parameter_name}</button>)}</div>}
          {selectedParam && <div><button onClick={() => setSelectedParam(null)} className="text-blue-600 underline mb-4">← Back to Params</button>
            <h2 className="text-xl font-bold">{selectedParam.parameter_name}</h2>
            <div className="flex gap-4 mt-4"><div className="bg-green-100 p-4 rounded">Top 5: {leaderboard?.top5.length || 0} offices</div><div className="bg-red-100 p-4 rounded">Bottom 5: {leaderboard?.bottom5.length || 0}</div></div></div>}
        </div>
      )}
    </main>
  )
}