import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — riwayat booking satu client + statistik aktual dari bookings
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  // Ambil no_wa dari clients table
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("no_wa")
    .eq("id", params.id)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, kode_booking, tgl_foto, nama_paket, nama_client, total_tagihan, dp_dibayar, status_sesi, status_pembayaran, created_at")
    .eq("no_wa", client.no_wa)
    .order("tgl_foto", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const bookings = data ?? []

  // Hitung statistik aktual dari data booking (bukan dari kolom cached di clients)
  const bookingAktif = bookings.filter((b: { status_sesi: string }) => b.status_sesi !== "cancel")
  const totalBooking  = bookingAktif.length
  const totalSpending = bookingAktif.reduce((s: number, b: { total_tagihan: number }) => s + b.total_tagihan, 0)
  const lastBookingDate = bookingAktif.length > 0
    ? bookingAktif.reduce((latest: string, b: { tgl_foto: string }) =>
        b.tgl_foto > latest ? b.tgl_foto : latest, bookingAktif[0].tgl_foto)
    : null

  return NextResponse.json({
    bookings,
    stats: { total_booking: totalBooking, total_spending: totalSpending, last_booking_date: lastBookingDate },
  })
}
