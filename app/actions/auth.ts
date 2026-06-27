'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// The master code for the Admin portal
const ADMIN_MASTER_CODE = '000000' 

export async function verifyPasscode(input: string) {
  // 1. Check if it is the Admin Master Code
  if (input === ADMIN_MASTER_CODE) {
    return { success: true, role: 'admin' }
  }

  // 2. Check if the input is a valid office_id in the 'offices' table
  const { data, error } = await supabase
    .from('offices') 
    .select('id')
    .eq('id', input)
    .single()

  if (error || !data) {
    return { success: false }
  }
  
  // 3. If found, route them as staff
  return { 
    success: true, 
    role: 'staff', 
    office_id: data.id 
  }
}