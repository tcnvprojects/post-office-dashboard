'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function bulkUpdateMetrics(data: any[], parameterId: string, month: string, part: string) {
  // We only map the office_id and actual_value from the CSV
  // We apply the month, part, and parameter_id from the UI selections
  const updates = data.map((row) => ({
    office_id: parseInt(row.office_id),
    parameter_id: parameterId,
    actual_value: parseFloat(row.actual_value), // Ensure your CSV header is "actual_value"
    remarks: '', // Default empty since it's not in your file
    month: month,
    week: part   // Stored in the 'week' column as discussed
  }))

  const { error } = await supabase
    .from('office_parameter_metrics')
    .upsert(updates, { onConflict: 'office_id, parameter_id, month, week' })

  if (error) return { error: error.message }
  return { success: true }
}