import { getSessionUserWithRole } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { timeToMinutes, minutesToTime } from "@/lib/time-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = session.user

  let body: {
    tgl_foto_baru?: string
    jam_mulai_baru?: string
    alasan?: string
    tambah_charge?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { tgl_foto_baru, jam_mulai_baru, alasan, tambah_charge } = body

  if (!tgl_foto_baru || !jam_mulai_baru) {
    return NextResponse.json(
      { error: "tgl_foto_baru dan jam_mulai_baru wajib diisi" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // 1. Ambil booking saat ini
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("id, kode_booking, nama_client, no_wa, nama_paket, tgl_foto, jam_mulai, jam_selesai, subtotal_addon, total_tagihan")
    .eq("id", params.id)
    .single()

  if (fetchErr || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
  }

  // 2. Hitung durasi dari booking lama, terapkan ke jam baru
  const durasiMenit = timeToMinutes(booking.jam_selesai) - timeToMinutes(booking.jam_mulai)
  const jamSelesaiBaru = minutesToTime(timeToMinutes(jam_mulai_baru) + durasiMenit)

  // Validasi jam selesai tidak melewati 21:00
  if (timeToMinutes(jamSelesaiBaru) > timeToMinutes("21:00")) {
    return NextResponse.json(
      { error: "Waktu sesi melebihi jam operasional (maksimal pukul 21:00)" },
      { status: 400 }
    )
  }

  // 3. Update data booking utama
  const { error: updateErr } = await supabase
    .from("bookings")
    .update({
      tgl_foto: tgl_foto_baru,
      jam_mulai: jam_mulai_baru,
      jam_selesai: jamSelesaiBaru,
    })
    .eq("id", params.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  // 4. Catat ke log reschedule
  const { error: logErr } = await supabase.from("booking_reschedule_log").insert({
    booking_id: params.id,
    tgl_foto_lama: booking.tgl_foto,
    jam_mulai_lama: booking.jam_mulai,
    jam_selesai_lama: booking.jam_selesai,
    tgl_foto_baru,
    jam_mulai_baru,
    jam_selesai_baru: jamSelesaiBaru,
    alasan: alasan ?? null,
    oleh_admin: user.id,
  })

  if (logErr) {
    console.error("Gagal mencatat reschedule log:", logErr.message)
  }

  // 5. Tambah charge reschedule mendadak jika dipilih
  if (tambah_charge) {
    const chargeAmount = 50000
    const { error: addonErr } = await supabase.from("booking_addons").insert({
      booking_id: params.id,
      jenis: "lainnya",
      nama_item: "Charge Reschedule Mendadak",
      qty: 1,
      harga_satuan: chargeAmount,
      subtotal: chargeAmount,
      source: "lapangan",
      catatan: "Reschedule H-1 atau hari-H",
    })

    if (addonErr) {
      console.error("Gagal menambah addon charge:", addonErr.message)
    } else {
      // Update total tagihan di tabel bookings
      await supabase
        .from("bookings")
        .update({
          subtotal_addon: (booking.subtotal_addon ?? 0) + chargeAmount,
          total_tagihan: (booking.total_tagihan ?? 0) + chargeAmount,
        })
        .eq("id", params.id)
    }
  }

  return NextResponse.json({ success: true, jam_selesai_baru: jamSelesaiBaru })
}