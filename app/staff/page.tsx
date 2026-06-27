'use client'

import { useRef, useState } from 'react'
import { createTicket } from '@/app/actions/tickets'

export default function StaffDashboard() {
  const formRef = useRef<HTMLFormElement>(null)
  const [banner, setBanner] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setBanner(null)
    const result = await createTicket(formData)
    setLoading(false)

    if (result.error) {
      setBanner({ type: 'error', message: result.error })
    } else {
      setBanner({
        type: 'success',
        message: `Ticket ${result.ticketCode} generated. Pls await reply`,
      })
      formRef.current?.reset()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Staff Dashboard
      </h1>

      {/* Scorecards placeholder - we will build this next */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow text-center text-gray-400">
          Performance scorecards coming soon
        </div>
      </div>

      {/* Raise Ticket Panel */}
      <div className="bg-white rounded-xl shadow p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          Raise a Ticket
        </h2>

        <form
          ref={formRef}
          action={handleSubmit}
        >
          <div className="mb-4">
            <label
              htmlFor="office_id"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Office ID
            </label>
            <input
              id="office_id"
              name="office_id"
              type="number"
              required
              placeholder="Enter your numeric office ID"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Describe the issue in detail"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>

        {/* Banner */}
        {banner && (
          <div
            className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
              banner.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {banner.message}
          </div>
        )}
      </div>
    </main>
  )
}