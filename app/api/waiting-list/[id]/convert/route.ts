import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { getSessionUserWithRole } from "@/lib/auth-server"
import { SEMUA_PAKET } from "@/lib/constants"
import { hitungHarga } from "@/lib/harga-booking"
import { timeToMinutes, minutesToTime } from "@/lib/time-utils"

interface ConvertBody {
  tgl_foto: string // "YYYY-MM-DD"
  jam_mulai: string // "HH:mm"
  catatan_admin?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: ConvertBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tgl_foto, jam_mulai, catatan_admin } = body
  if (!tgl_foto || !jam_mulai) {
    return NextResponse.json(
      { error: "Tanggal foto dan jam mulai wajib diisi" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // 1. Ambil data waiting list
  const { data: wl, error: wlError } = await supabase
    .from("waiting_list")
    .select("*")
    .eq("id", params.id)
    .single()

  if (wlError || !wl) {
    return NextResponse.json({ error: "Data waiting list tidak ditemukan" }, { status: 404 })
  }

  if (wl.status === "dijadwalkan") {
    return NextResponse.json(
      { error: "Client ini sudah dijadwalkan sebelumnya ke booking" },
      { status: 400 }
    )
  }

  // 2. Verifikasi paket & hitung harga / durasi
  const paket = SEMUA_PAKET.find((p) => p.id === wl.paket_id)
  const addons = (wl.addons as {
    tambahanWaktu?: number
    tambahanOrang?: number
    tambahanBackground?: number
    cetak12R?: number
    cetak20R?: number
  }) ?? {
    tambahanWaktu: 0,
    tambahanOrang: 0,
    tambahanBackground: 0,
    cetak12R: 0,
    cetak20R: 0,
  }

  const rincian = hitungHarga(wl.paket_id, {
    tambahanWaktu: addons.tambahanWaktu ?? 0,
    tambahanOrang: addons.tambahanOrang ?? 0,
    tambahanBackground: addons.tambahanBackground ?? 0,
    cetak12R: addons.cetak12R ?? 0,
    cetak20R: addons.cetak20R ?? 0,
  })

  const mulaiMenit = timeToMinutes(jam_mulai)
  const selesaiMin = mulaiMenit + rincian.durasiTotal
  const jamSelesai = minutesToTime(selesaiMin)

  if (selesaiMin > timeToMinutes("21:00")) {
    return NextResponse.json(
      { error: "Waktu sesi melebihi jam operasional studio (maksimal pukul 21:00)" },
      { status: 400 }
    )
  }

  // 3. Cek bentrok slot di bookings
  const { data: existingBookings, error: checkError } = await supabase
    .from("bookings")
    .select("id, kode_booking, jam_mulai, jam_selesai, nama_client")
    .eq("tgl_foto", tgl_foto)
    .neq("status_sesi", "cancel")

  if (checkError) {
    return NextResponse.json({ error: "Gagal memverifikasi slot" }, { status: 500 })
  }

  const bentrok = (existingBookings ?? []).find((b: { jam_mulai: string; jam_selesai: string }) => {
    return timeToMinutes(b.jam_mulai) === mulaiMenit
  }) as { kode_booking: string; jam_mulai: string; jam_selesai: string; nama_client: string } | undefined

  if (bentrok) {
    return NextResponse.json(
      {
        error: `Slot bentrok dengan booking ${bentrok.kode_booking} (${bentrok.nama_client}, ${bentrok.jam_mulai}–${bentrok.jam_selesai})`,
      },
      { status: 409 }
    )
  }

  // 4. Buat entri di bookings
  const gabungCatatan = [
    wl.catatan ? `[Client]: ${wl.catatan}` : "",
    wl.preferensi_jadwal ? `[Preferensi Awal]: ${wl.preferensi_jadwal}` : "",
    catatan_admin ? `[Admin]: ${catatan_admin}` : "",
    "(Dari Waiting List)",
  ]
    .filter(Boolean)
    .join("\n")

  const { data: insertedBooking, error: insertBookingErr } = await supabase
    .from("bookings")
    .insert({
      kategori_sesi: wl.kategori_sesi,
      paket_id: wl.paket_id,
      nama_paket: wl.nama_paket || paket?.nama || "Paket Foto",
      tgl_foto: tgl_foto,
      jam_mulai: jam_mulai,
      jam_selesai: jamSelesai,
      nama_client: wl.nama_client,
      no_wa: wl.no_wa,
      email: wl.email,
      jumlah_orang: wl.jumlah_orang,
      background_dipilih: wl.background_dipilih ?? [],
      subtotal_paket: rincian.subtotalPaket,
      subtotal_addon: rincian.subtotalAddon,
      total_tagihan: rincian.total,
      catatan: gabungCatatan || null,
      status_pembayaran: "belum_dp",
      status_sesi: "pending",
      created_by_admin: true,
    })
    .select("id, kode_booking")
    .single()

  if (insertBookingErr || !insertedBooking) {
    console.error("Insert booking error:", insertBookingErr)
    return NextResponse.json(
      { error: "Gagal membuat jadwal booking baru" },
      { status: 500 }
    )
  }

  // 5. Masukkan add-on ke booking_addons jika ada
  const addonRows: Array<{
    booking_id: string
    jenis: "tambahan_waktu" | "tambahan_orang" | "tambahan_background" | "cetak_12r" | "cetak_20r"
    nama_item: string
    qty: number
    harga_satuan: number
    subtotal: number
    source: "booking_awal"
  }> = []

  if (addons.tambahanWaktu && addons.tambahanWaktu > 0) {
    addonRows.push({
      booking_id: insertedBooking.id,
      jenis: "tambahan_waktu",
      nama_item: `Tambahan Waktu (${addons.tambahanWaktu * 10} menit)`,
      qty: addons.tambahanWaktu,
      harga_satuan: 150000,
      subtotal: addons.tambahanWaktu * 150000,
      source: "booking_awal",
    })
  }
  if (addons.tambahanOrang && addons.tambahanOrang > 0) {
    addonRows.push({
      booking_id: insertedBooking.id,
      jenis: "tambahan_orang",
      nama_item: `Tambahan Orang (${addons.tambahanOrang} orang)`,
      qty: addons.tambahanOrang,
      harga_satuan: 20000,
      subtotal: addons.tambahanOrang * 20000,
      source: "booking_awal",
    })
  }
  if (addons.tambahanBackground && addons.tambahanBackground > 0) {
    addonRows.push({
      booking_id: insertedBooking.id,
      jenis: "tambahan_background",
      nama_item: `Tambahan Background (${addons.tambahanBackground} background)`,
      qty: addons.tambahanBackground,
      harga_satuan: 100000,
      subtotal: addons.tambahanBackground * 100000,
      source: "booking_awal",
    })
  }
  if (addons.cetak12R && addons.cetak12R > 0) {
    addonRows.push({
      booking_id: insertedBooking.id,
      jenis: "cetak_12r",
      nama_item: `Cetak 12R + Frame ×${addons.cetak12R}`,
      qty: addons.cetak12R,
      harga_satuan: 150000,
      subtotal: addons.cetak12R * 150000,
      source: "booking_awal",
    })
  }
  if (addons.cetak20R && addons.cetak20R > 0) {
    addonRows.push({
      booking_id: insertedBooking.id,
      jenis: "cetak_20r",
      nama_item: `Cetak 20R + Frame ×${addons.cetak20R}`,
      qty: addons.cetak20R,
      harga_satuan: 400000,
      subtotal: addons.cetak20R * 400000,
      source: "booking_awal",
    })
  }

  if (addonRows.length > 0) {
    await supabase.from("booking_addons").insert(addonRows)
  }

  // 6. Update waiting list status
  await supabase
    .from("waiting_list")
    .update({
      status: "dijadwalkan",
      booking_id: insertedBooking.id,
      dijadwalkan_pada: new Date().toISOString(),
      dijadwalkan_oleh: session.user.id,
    })
    .eq("id", params.id)

  return NextResponse.json({
    success: true,
    booking_id: insertedBooking.id,
    kode_booking: insertedBooking.kode_booking,
  })
}

// PATCH: Untuk update status waiting list (misal dibatalkan)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUserWithRole()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { status: "menunggu" | "batal" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  if (!["menunggu", "batal"].includes(body.status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("waiting_list")
    .update({ status: body.status, updated_at: new Date().toISOString() })
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
