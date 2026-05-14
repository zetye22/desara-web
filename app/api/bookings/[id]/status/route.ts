import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"
import { kirimNotifikasi, fetchBookingForNotif } from "@/lib/notifikasi-server"

const VALID_STATUS_SESI = ["pending", "booked", "selesai_foto", "selesai_edit", "diambil", "cancel"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Hanya admin yang bisa update status
  const supabaseAuth = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (supabaseAuth as any).auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { status_sesi?: string; status_pembayaran?: string; dp_dibayar?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  if (body.status_sesi && !VALID_STATUS_SESI.includes(body.status_sesi)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.status_sesi)                     updateData.status_sesi       = body.status_sesi
  if (body.status_pembayaran)               updateData.status_pembayaran = body.status_pembayaran
  if (typeof body.dp_dibayar === "number")  updateData.dp_dibayar        = body.dp_dibayar

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 })
  }

  // Auto-trigger WA (fire-and-forget, tidak blokir response)
  if (process.env.FONNTE_API_TOKEN) {
    void triggerAutoWA(params.id, body)
  }

  return NextResponse.json({ success: true })
}

// Kirim WA otomatis sesuai status yang baru diset
async function triggerAutoWA(
  bookingId: string,
  body: { status_sesi?: string; status_pembayaran?: string }
) {
  try {
    const booking = await fetchBookingForNotif(bookingId)
    if (!booking) return

    // DP dikonfirmasi → kirim konfirmasi ke client
    if (body.status_pembayaran === "dp_ok") {
      await kirimNotifikasi(booking, "konfirmasi_dp_diterima")
    }

    // Foto selesai edit → kirim notifikasi siap ambil
    if (body.status_sesi === "selesai_edit") {
      await kirimNotifikasi(booking, "foto_siap_diambil")
    }
  } catch {
    // Jangan crash API jika WA gagal
  }
}
