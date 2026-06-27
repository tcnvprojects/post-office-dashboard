'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 1. Fetch the overall structure (Verticals + Parameters)
export async function getMatrixStructure() {
  const { data, error } = await supabase
    .from('parameter_verticals')
    .select(`
      id, vertical_code, vertical_name,
      parameters ( id, parameter_code, parameter_name, target_value, target_unit, description )
    `)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

// 2. Fetch specific metrics for a Staff Office
export async function getOfficeMetrics(numericOfficeId: number) {
  const { data: office } = await supabase
    .from('offices')
    .select('id, office_name')
    .eq('office_id', numericOfficeId)
    .single()

  if (!office) return { error: 'Office not found' }

  const { data: metrics } = await supabase
    .from('office_parameter_metrics')
    .select('*')
    .eq('office_id', office.id)
    // Assuming we want the latest entries, we can sort by period
    .order('period', { ascending: false })

  return { office, metrics: metrics || [] }
}

// 3. Admin: Get Top 5 and Bottom 5 for a specific parameter
export async function getParameterLeaderboard(parameterId: string) {
  const { data, error } = await supabase
    .from('office_parameter_metrics')
    .select(`
      actual_value, remarks,
      offices ( office_id, office_name )
    `)
    .eq('parameter_id', parameterId)
    .order('actual_value', { ascending: false })

  if (error || !data) return { top5: [], bottom5: [] }

  // Extract Top 5 and Bottom 5
  const top5 = data.slice(0, 5)
  // Reverse bottom 5 so the absolute worst is at the top of the bottom list
  const bottom5 = data.length > 5 ? data.slice(-5).reverse() : []

  return { top5, bottom5 }
}