'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { getMatrixStructure, getOfficeMetrics } from '@/app/actions/performance'

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null)
  const [selectedVertical, setSelectedVertical] = useState<any>(null)

  useEffect(() => { /* Fetch data similar to previous logic */ }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <Header role="staff" onGrievance={() => alert('Open Ticket Form')} />
      <div className="max-w-4xl mx-auto p-6">
        {/* Overall Score Card */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-6">
          <p className="opacity-80">Overall Performance</p>
          <h2 className="text-5xl font-bold">88.5%</h2>
        </div>

        {/* Verticals */}
        {!selectedVertical ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Business', 'Operations', 'Behavioral'].map(v => (
              <button key={v} onClick={() => setSelectedVertical(v)} className="bg-white p-6 rounded-xl shadow border hover:border-blue-400 transition">
                <h3 className="font-bold text-lg">{v}</h3>
                <div className="w-full bg-gray-200 h-2 mt-4 rounded-full"><div className="bg-blue-600 h-full w-[80%] rounded-full" /></div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow">
             <button onClick={() => setSelectedVertical(null)} className="text-blue-600 mb-4 underline">← Back</button>
             {/* Add Period Filter dropdown and Parameter details here */}
          </div>
        )}
      </div>
    </main>
  )
}