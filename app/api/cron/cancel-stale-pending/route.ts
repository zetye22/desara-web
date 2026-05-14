import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendWhatsApp } from "@/lib/fonnte"

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

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

  // Kirim WA ke setiap client (fire-and-forget)
  for (const booking of stalePending as {
    nama_client: string; no_wa: string; nama_paket: string
    tgl_foto: string; jam_mulai: string; jam_selesai: string
  }[]) {
    void sendAutoCancelWA(booking, jamBatas)
  }

  return NextResponse.json({
    cancelled: stalePending.length,
    ids,
    message: `${stalePending.length} booking pending di-cancel otomatis`,
  })
}

async function sendAutoCancelWA(
  booking: { nama_client: string; no_wa: string; nama_paket: string; tgl_foto: string; jam_mulai: string; jam_selesai: string },
  jamBatas: number
) {
  const tglFormatted = new Date(booking.tgl_foto + "T00:00:00").toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const pesan =
    `Halo Kak ${booking.nama_client.split(" ")[0]},\n` +
    `Booking kamu otomatis dibatalkan karena DP belum dikonfirmasi dalam ${jamBatas} jam.\n\n` +
    `📅 ${tglFormatted} · ${booking.jam_mulai}–${booking.jam_selesai}\n` +
    `📦 ${booking.nama_paket}\n\n` +
    `Mau booking lagi? Hubungi kami ya. Terima kasih 🙏`

  await sendWhatsApp(booking.no_wa, pesan).catch(() => null)
}
