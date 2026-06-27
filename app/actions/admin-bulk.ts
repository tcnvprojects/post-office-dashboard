'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function bulkUpdateMetrics(data: any[], parameterId: string, month: string, week: string) {
  // Map the CSV rows into the format your DB expects
  const updates = data.map((row) => ({
    office_id: parseInt(row.office_id),
    parameter_id: parameterId,
    actual_value: parseFloat(row.actual_value),
    remarks: row.remarks || '',
    month: month,
    week: week
  }))

  const { error } = await supabase
    .from('office_parameter_metrics')
    .upsert(updates, { onConflict: 'office_id, parameter_id, month, week' })

  if (error) return { error: error.message }
  return { success: true }
}