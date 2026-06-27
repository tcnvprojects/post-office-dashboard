'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function verifyPasscode(input: string) {
  // We check if input matches either the 'passcode' or 'office_id' column
  const { data, error } = await supabase
    .from('users') 
    .select('role, office_id')
    .or(`passcode.eq.${input},office_id.eq.${input}`)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error("Auth Error:", error); // Check your terminal logs if this fails
    return { success: false }
  }
  
  return { 
    success: true, 
    role: data.role, 
    office_id: data.office_id 
  }
}