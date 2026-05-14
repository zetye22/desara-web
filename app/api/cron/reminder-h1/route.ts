import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { kirimNotifikasi } from "@/lib/notifikasi-server"

// GET /api/cron/reminder-h1
// Dipanggil Vercel Cron jam 18:00 WIB (11:00 UTC) setiap hari
// Kirim reminder ke semua booking besok yang status dp_ok
export async function GET(request: NextRequest) {
  // Validasi CRON_SECRET supaya tidak bisa diakses sembarangan
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Tanggal besok di timezone Jakarta (UTC+7)
  const now = new Date()
  const jakartaOffset = 7 * 60
  const jakartaMs = now.getTime() + (jakartaOffset - now.getTimezoneOffset()) * 60000
  const jakartaDate = new Date(jakartaMs)
  jakartaDate.setDate(jakartaDate.getDate() + 1)
  const besok = jakartaDate.toISOString().split("T")[0] // "YYYY-MM-DD"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Ambil booking besok yang DP sudah ok (belum cancel)
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, nama_client, no_wa, tgl_foto, jam_mulai, nama_paket, total_tagihan, dp_dibayar")
    .eq("tgl_foto", besok)
    .eq("status_pembayaran", "dp_ok")
    .neq("status_sesi", "cancel")

  if (error) {
    console.error("[cron/reminder-h1] fetch error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results = []
  for (const booking of bookings ?? []) {
    const result = await kirimNotifikasi(booking, "reminder_h1")
    results.push({ id: booking.id, nama: booking.nama_client, ...result })
  }

  return NextResponse.json({
    tanggal_besok: besok,
    total: results.length,
    results,
  })
}
