import { getSessionUserWithRole } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { timeToMinutes } from "@/lib/time-utils"
import { OPERASIONAL } from "@/lib/constants"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user

  let body: { nominal?: number; catatan?: string; metode?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const nominal = Number(body.nominal ?? 0)
  if (!nominal || nominal < OPERASIONAL.dpMinimum) {
    return NextResponse.json(
      { error: `Nominal DP minimal Rp ${OPERASIONAL.dpMinimum.toLocaleString("id-ID")}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // 1. Ambil data booking
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, kode_booking, nama_client, no_wa, nama_paket, tgl_foto, jam_mulai, jam_selesai, total_tagihan, status_sesi, status_pembayaran")
    .eq("id", params.id)
    .single()

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
  }

  if (booking.status_pembayaran !== "belum_dp") {
    return NextResponse.json({ error: "DP sudah pernah dikonfirmasi" }, { status: 409 })
  }

  // 2. Anti-bentrok: cek slot terhadap booking BOOKED atau PENDING lain
  // Include "pending" untuk cegah race condition saat 2 admin confirm DP bersamaan
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, kode_booking, jam_mulai, jam_selesai, nama_client")
    .eq("tgl_foto", booking.tgl_foto)
    .in("status_sesi", ["booked", "pending"])
    .neq("id", params.id)

  const mulai   = timeToMinutes(booking.jam_mulai)
  const selesai = timeToMinutes(booking.jam_selesai)

  const bentrok = (existingBookings ?? []).find((b: { jam_mulai: string; jam_selesai: string }) => {
    return timeToMinutes(b.jam_mulai) < selesai && timeToMinutes(b.jam_selesai) > mulai
  }) as { kode_booking: string; jam_mulai: string; jam_selesai: string; nama_client: string } | undefined

  if (bentrok) {
    return NextResponse.json(
      {
        error: `Slot sudah diambil oleh ${bentrok.nama_client} (${bentrok.kode_booking}, ${bentrok.jam_mulai}–${bentrok.jam_selesai}). Konfirmasi DP ditolak — silakan reschedule booking ini ke slot lain.`,
        bentrok: true,
        bentrok_dengan: bentrok.kode_booking,
      },
      { status: 409 }
    )
  }

  // 3. Tentukan status pembayaran baru
  const statusPembayaran = nominal >= booking.total_tagihan ? "lunas" : "dp_ok"

  // 4. Update booking
  const tglDpJkt = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  const updatePayload: Record<string, unknown> = {
    dp_dibayar:        nominal,
    status_pembayaran: statusPembayaran,
    status_sesi:       "booked",
    tgl_dp:            tglDpJkt,
  }
  // Kalau langsung lunas saat konfirmasi DP, set juga tgl_pelunasan
  if (statusPembayaran === "lunas") {
    updatePayload.tgl_pelunasan = tglDpJkt
  }
  if (body.catatan) updatePayload.catatan = body.catatan
  if (body.metode) updatePayload.metode_dp = body.metode

  const { error: updateErr } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // Log perubahan pembayaran
  const { data: profile } = await supabase.from("admin_profiles").select("nama").eq("user_id", user.id).single()
  await supabase.from("booking_payment_log").insert({
    booking_id:  params.id,
    status_lama: "belum_dp",
    status_baru: statusPembayaran,
    nominal,
    metode:      body.metode ?? null,
    catatan:     body.catatan ?? null,
    admin_id:    user.id,
    admin_nama:  profile?.nama ?? user.email ?? null,
  }).then(() => {})

  return NextResponse.json({
    success:           true,
    status_pembayaran: statusPembayaran,
    status_sesi:       "booked",
    dp_dibayar:        nominal,
  })
}
