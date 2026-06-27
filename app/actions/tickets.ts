'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateUniqueTicketCode(): Promise<number> {
  while (true) {
    const code = Math.floor(100000 + Math.random() * 900000)
    const { data } = await supabase
      .from('tickets')
      .select('id')
      .eq('ticket_code', code)
      .maybeSingle()
    if (!data) return code
  }
}

export async function createTicket(formData: FormData) {
  const officeId = formData.get('office_id')?.toString().trim()
  const description = formData.get('description')?.toString().trim()

  if (!officeId || !description) {
    return { error: 'Error: Office ID and description are required.' }
  }

  const { data: office, error: officeError } = await supabase
    .from('offices')
    .select('id, office_id, office_name')
    .eq('office_id', officeId)
    .maybeSingle()

  if (officeError || !office) {
    return { error: 'Error: Invalid office ID. Please check the code.' }
  }

  const ticketCode = await generateUniqueTicketCode()
  const title = `Ticket from office ${office.office_id}`

  const { error: insertError } = await supabase.from('tickets').insert({
    office_id: office.id,
    ticket_code: ticketCode,
    title,
    description,
    status: 'open',
  })

  if (insertError) {
    return { error: 'Error: Could not create ticket. Please try again.' }
  }

  return { success: true, ticketCode }
}

export async function getTicketStatus(ticketCode: number) {
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      offices ( office_name ),
      ticket_replies ( message, created_at )
    `)
    .eq('ticket_code', ticketCode)
    .maybeSingle()

  if (ticketError || !ticket) {
    return { error: 'Ticket not found. Please check the 6-digit code.' }
  }

  if (ticket.ticket_replies) {
    ticket.ticket_replies.sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }

  return { data: ticket }
}

export async function escalateTicket(ticketId: string, reason: string) {
  // 1. Insert the escalation reason as a special reply
  await supabase.from('ticket_replies').insert({
    ticket_id: ticketId,
    message: `🚨 ESCALATED BY STAFF: ${reason}`
  })

  // 2. Update the status to 'escalated'
  const { error } = await supabase.from('tickets').update({ status: 'escalated' }).eq('id', ticketId)
  
  if (error) {
    return { error: 'Failed to escalate ticket.' }
  }
  return { success: true }
}