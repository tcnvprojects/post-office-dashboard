'use server'

import { createClient } from '@supabase/supabase-js'

// Ensure you have these environment variables set in your .env.local file
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyPasscode(passcode: string) {
  const { data, error } = await supabase
    .from('staff') 
    .select('role, office_id')
    .eq('passcode', passcode)
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