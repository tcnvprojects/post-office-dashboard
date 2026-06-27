'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_MASTER_CODE = '000000' 

export async function verifyPasscode(input: string) {
  // 1. Check if it is the Admin Master Code
  if (input === ADMIN_MASTER_CODE) {
    return { success: true, role: 'admin' }
  }

  // 2. Query the exact 'office_id' column in your 'offices' table
  const { data, error } = await supabase
    .from('offices') 
    .select('office_id')
    .eq('office_id', input)
    .single()

  if (error || !data) {
    return { success: false }
  }
  
  // 3. If found, route them as staff using the verified office_id
  return { 
    success: true, 
    role: 'staff', 
    office_id: data.office_id 
  }
}