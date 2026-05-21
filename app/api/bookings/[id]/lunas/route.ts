import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/bookings/[id]/lunas
// Tandai booking sudah lunas — set status_pembayaran = "lunas" dan tgl_pelunasan
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cek autentikasi
  const {
    data: { user },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = await (createClient() as any).auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const bookingId = params.id

  // Ambil total_tagihan dari booking
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status_pembayaran")
    .eq("id", bookingId)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json(
      { error: "Booking tidak ditemukan" },
      { status: 404 }
    )
  }

  // Baca metode pelunasan dari body jika ada
  let metode: string | null = null
  try {
    const b = await request.json().catch(() => ({}))
    metode = (b as { metode?: string }).metode ?? null
  } catch { /* opsional */ }

  const tglLunasJkt = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })

  // Update status_pembayaran = lunas dan set tgl_pelunasan
  // dp_dibayar TIDAK diubah agar nominal DP asli tetap tercatat untuk laporan keuangan
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status_pembayaran: "lunas",
      tgl_pelunasan:     tglLunasJkt,
      ...(metode ? { metode_pelunasan: metode } : {}),
    })
    .eq("id", bookingId)

  if (updateError) {
    return NextResponse.json(
      { error: "Gagal menandai lunas" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
  })
}
