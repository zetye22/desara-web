import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { kirimNotifikasi } from "@/lib/notifikasi-server"

// GET /api/cron/follow-up
// Dipanggil Vercel Cron jam 19:00 WIB (12:00 UTC) setiap hari
// Kirim follow-up review ke booking yang sudah 3 hari berstatus "diambil"
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Tanggal 3 hari yang lalu (Jakarta)
  const now = new Date()
  const jakartaOffset = 7 * 60
  const jakartaMs = now.getTime() + (jakartaOffset - now.getTimezoneOffset()) * 60000
  const jakartaDate = new Date(jakartaMs)
  jakartaDate.setDate(jakartaDate.getDate() - 3)
  const tgl3HariLalu = jakartaDate.toISOString().split("T")[0]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Booking yang tgl_foto = 3 hari lalu dan sudah "diambil"
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, nama_client, no_wa, tgl_foto, jam_mulai, nama_paket, total_tagihan, dp_dibayar")
    .eq("tgl_foto", tgl3HariLalu)
    .eq("status_sesi", "diambil")

  if (error) {
    console.error("[cron/follow-up] fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Cek apakah follow_up sudah pernah dikirim (hindari duplikat)
  const results = []
  for (const booking of bookings ?? []) {
    // Skip kalau sudah ada log follow_up untuk booking ini
    const { data: existing } = await supabase
      .from("notifikasi_log")
      .select("id")
      .eq("booking_id", booking.id)
      .eq("jenis", "follow_up")
      .eq("status", "sent")
      .limit(1)
      .single()

    if (existing) {
      results.push({ id: booking.id, nama: booking.nama_client, success: true, skipped: true })
      continue
    }

    const result = await kirimNotifikasi(booking, "follow_up_review")
    results.push({ id: booking.id, nama: booking.nama_client, ...result })
  }

  return NextResponse.json({
    tanggal_target: tgl3HariLalu,
    total: results.length,
    results,
  })
}
