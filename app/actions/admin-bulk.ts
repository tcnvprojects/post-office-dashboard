'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Helper to convert Month/Part to a SQL Date (YYYY-MM-DD)
function getPeriodDate(month: string, part: string) {
  const year = new Date().getFullYear();
  const monthMap: Record<string, number> = { 
    'January': 0, 'February': 1, 'March': 2, 'April': 3, 'May': 4, 'June': 5, 
    'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11 
  };
  
  let day = 1;
  if (part === 'Part 2') day = 11;
  if (part === 'Part 3') day = 21;
  
  return new Date(year, monthMap[month], day).toISOString().split('T')[0];
}

export async function bulkUpdateMetrics(data: any[], parameterId: string, month: string, part: string) {
  // 1. Fetch office mapping (Numeric ID -> UUID)
  const { data: offices } = await supabase.from('offices').select('id, office_id');
  if (!offices) return { error: 'Could not fetch office mappings' };

  const period = getPeriodDate(month, part);

  // 2. Map data
  const updates = data.map((row) => {
    const office = offices.find((o) => String(o.office_id) === String(row.office_id));
    return {
      office_id: office?.id,
      parameter_id: parameterId,
      actual_value: parseFloat(row.actual_value),
      period: period,
      month: month,
      week: part, // Storing 'Part 1', etc here
      remarks: row.remarks || ''
    }
  }).filter(item => item.office_id); // Filter out rows with invalid office IDs

  // 3. Upsert
  const { error } = await supabase
    .from('office_parameter_metrics')
    .upsert(updates, { onConflict: 'office_id, parameter_id, period' });

  if (error) return { error: error.message };
  return { success: true };
}