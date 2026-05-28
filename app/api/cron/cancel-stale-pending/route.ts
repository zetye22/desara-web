import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET /api/cron/cancel-stale-pending
// Auto-cancel booking pending yang tidak dikonfirmasi dalam 24 jam
// Dipanggil oleh Vercel Cron atau manual oleh admin

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verifikasi secret agar tidak bisa dipanggil sembarangan
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Cek waktu auto-cancel dari settings (default 24 jam)
  const { data: settingData } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "auto_cancel_jam")
    .maybeSingle()

  const jamBatas = parseInt(settingData?.value ?? "24", 10)
  const batasWaktu = new Date(Date.now() - jamBatas * 60 * 60 * 1000).toISOString()

  // Ambil semua pending yang melewati batas waktu
  const { data: stalePending, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, kode_booking, nama_client, no_wa, nama_paket, tgl_foto, jam_mulai, jam_selesai")
    .eq("status_sesi", "pending")
    .lt("created_at", batasWaktu)

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  if (!stalePending || stalePending.length === 0) {
    return NextResponse.json({ cancelled: 0, message: "Tidak ada pending kadaluarsa" })
  }

  const ids = stalePending.map((b: { id: string }) => b.id)

  // Update semua jadi cancel
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      status_sesi: "cancel",
      catatan:     `Auto-cancel: booking pending lebih dari ${jamBatas} jam tanpa konfirmasi DP`,
    })
    .in("id", ids)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({
    cancelled: stalePending.length,
    ids,
    message: `${stalePending.length} booking pending di-cancel otomatis`,
  })
}
