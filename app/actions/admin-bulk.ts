'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function bulkUpdateMetrics(data: any[], parameterId: string, month: string, part: string) {
  // 1. Get all offices to map numeric IDs to UUIDs
  const { data: offices, error: officeError } = await supabase
    .from('offices')
    .select('id, office_id'); // Ensure 'office_id' here is the numeric column name

  if (officeError) return { error: 'Failed to fetch office mappings' };

  // 2. Map the data
  const updates = data.map((row) => {
    // Find the UUID that matches the numeric ID from the CSV
    const office = offices.find((o) => String(o.office_id) === String(row.office_id));
    
    return {
      office_id: office?.id, // Use the UUID from the database
      parameter_id: parameterId,
      actual_value: parseFloat(row.actual_value),
      remarks: row.remarks || '',
      month: month,
      week: part
    }
  }).filter(item => item.office_id); // Remove rows where office not found

  // 3. Upsert
  const { error } = await supabase
    .from('office_parameter_metrics')
    .upsert(updates, { onConflict: 'office_id, parameter_id, month, week' })

  if (error) return { error: error.message }
  return { success: true }
}