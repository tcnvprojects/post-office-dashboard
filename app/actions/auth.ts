'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Define your secret Admin code here
const ADMIN_SECRET = '000000' 

export async function validateLogin(inputCode: string) {
  // 1. Check if it's the Admin
  if (inputCode === ADMIN_SECRET) {
    return { role: 'admin' }
  }

  // 2. Check if it's a valid Office ID
  const { data: office, error } = await supabase
    .from('offices')
    .select('id, office_id')
    .eq('office_id', parseInt(inputCode))
    .maybeSingle()

  if (error || !office) {
    return { error: 'Invalid ID or Office not found.' }
  }

  // 3. Return Staff context
  return { role: 'staff', officeId: office.office_id }
}