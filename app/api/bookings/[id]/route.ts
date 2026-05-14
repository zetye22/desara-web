import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// GET — satu booking lengkap dengan nama staff
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `id, kode_booking, nama_client, no_wa, paket_id, nama_paket, tgl_foto,
       jam_mulai, jam_selesai, jumlah_orang, background_dipilih,
       status_sesi, status_pembayaran, total_tagihan, dp_dibayar, subtotal_paket,
       subtotal_addon, email, bukti_transfer_url, kategori_sesi, catatan, created_at,
       photographer_1_id, photographer_2_id, editor_id,
       upah_pg1, upah_pg2, upah_editor, total_upah_staff`
    )
    .eq("id", params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })

  // Resolve nama staff dari staff_upah
  const staffIds = new Set<string>()
  if (data.photographer_1_id) staffIds.add(data.photographer_1_id)
  if (data.photographer_2_id) staffIds.add(data.photographer_2_id)
  if (data.editor_id)         staffIds.add(data.editor_id)

  const staffMap = new Map<string, string>()
  if (staffIds.size > 0) {
    const { data: staffData } = await supabase
      .from("staff_upah")
      .select("id, nama")
      .in("id", Array.from(staffIds))
    for (const s of (staffData ?? [])) staffMap.set(s.id, s.nama)
  }

  const booking = {
    ...data,
    pg1: data.photographer_1_id ? { id: data.photographer_1_id, nama: staffMap.get(data.photographer_1_id) ?? "?" } : null,
    pg2: data.photographer_2_id ? { id: data.photographer_2_id, nama: staffMap.get(data.photographer_2_id) ?? "?" } : null,
    ed:  data.editor_id          ? { id: data.editor_id,         nama: staffMap.get(data.editor_id)         ?? "?" } : null,
  }

  return NextResponse.json({ booking })
}
