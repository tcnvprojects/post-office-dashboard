import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseServer = createClient(supabaseUrl, serviceRoleKey)

export async function POST(request: Request) {
  const body = await request.json()
  const passcode = body.passcode as string

  if (!passcode) {
    return NextResponse.json(
      { error: 'Passcode is required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseServer
    .from('passcodes')
    .select('id, role, office_id')
    .eq('passcode', passcode)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Invalid passcode' },
      { status: 401 }
    )
  }

  return NextResponse.json(
    { role: data.role, office_id: data.office_id },
    { status: 200 }
  )
}