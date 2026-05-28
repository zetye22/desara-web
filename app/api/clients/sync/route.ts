import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST — sinkronisasi statistik client (total_booking, total_spending, last_booking_date) dari tabel bookings
export async function POST() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { data: allClients, error: clientsError } = await supabase
    .from("clients")
    .select("id, no_wa")

  if (clientsError) return NextResponse.json({ error: clientsError.message }, { status: 500 })

  let updated = 0

  for (const client of allClients ?? []) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("total_tagihan, tgl_foto")
      .eq("no_wa", client.no_wa)
      .neq("status", "cancel")

    const total_booking = bookings?.length ?? 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const total_spending = (bookings ?? []).reduce((sum: number, b: any) => sum + (b.total_tagihan ?? 0), 0)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sorted = [...(bookings ?? [])].sort((a: any, b: any) =>
      new Date(b.tgl_foto).getTime() - new Date(a.tgl_foto).getTime()
    )
    const last_booking_date = sorted.length > 0 ? sorted[0].tgl_foto : null

    await supabase
      .from("clients")
      .update({ total_booking, total_spending, last_booking_date })
      .eq("id", client.id)

    updated++
  }

  return NextResponse.json({ success: true, updated })
}
