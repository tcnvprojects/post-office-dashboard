'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      offices ( office_name, office_id )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }
  return { data }
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) {
    return { error: 'Failed to update status' }
  }
  return { success: true }
}

export async function addReply(ticketId: string, message: string, closeTicket: boolean) {
  // 1. Insert the reply
  const { error: replyError } = await supabase
    .from('ticket_replies')
    .insert({
      ticket_id: ticketId,
      message
    })

  if (replyError) {
    return { error: 'Failed to add reply' }
  }

  // 2. Update status if needed (e.g., closing the ticket)
  if (closeTicket) {
    await supabase.from('tickets').update({ status: 'closed' }).eq('id', ticketId)
  } else {
    await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', ticketId)
  }

  return { success: true }
}