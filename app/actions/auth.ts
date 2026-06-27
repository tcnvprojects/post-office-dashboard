'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyPasscode(passcode: string) {
  const { data, error } = await supabase
    .from('users') 
    .select('role, office_id')
    .eq('passcode', passcode)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return { success: false }
  }
  
  return { 
    success: true, 
    role: data.role, 
    office_id: data.office_id 
  }
}