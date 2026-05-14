import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createBookingSchema } from "@/lib/booking-server-schema"
import { SEMUA_PAKET } from "@/lib/constants"
import { hitungHarga } from "@/lib/harga-booking"
import { timeToMinutes, minutesToTime } from "@/lib/time-utils"

// Rate limiter sederhana — max 3 booking per IP per 10 menit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now      = Date.now()
  const windowMs = 10 * 60 * 1000
  const current  = rateLimitMap.get(ip)

  if (!current || now > current.resetAt) {
    // Bersihkan entri kadaluarsa agar Map tidak tumbuh tak terbatas
    if (rateLimitMap.size > 200) {
      rateLimitMap.forEach((val, key) => {
        if (now > val.resetAt) rateLimitMap.delete(key)
      })
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (current.count >= 3) return false
  current.count++
  return true
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi dalam 10 menit." },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  // Validasi dengan Zod
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", detail: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Cari paket di server (jangan trust paket_id sembarangan)
  const paket = SEMUA_PAKET.find((p) => p.id === data.paket_id)
  if (!paket) {
    return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 400 })
  }
  if (paket.kategori !== data.kategori_sesi) {
    return NextResponse.json({ error: "Kategori tidak sesuai paket" }, { status: 400 })
  }

  // Hitung harga di server — jangan trust angka dari client
  const rincian    = hitungHarga(data.paket_id, data.addons)
  const mulaiMenit = timeToMinutes(data.jam_mulai)
  const selesaiMin = mulaiMenit + rincian.durasiTotal
  const jamSelesai = minutesToTime(selesaiMin)

  // Validasi jam tidak melebihi operasional
  if (selesaiMin > timeToMinutes("21:00")) {
    return NextResponse.json(
      { error: "Waktu sesi melebihi jam operasional studio (maksimal pukul 21:00)" },
      { status: 400 }
    )
  }

  // Validasi tanggal tidak kurang dari hari ini
  const tglFoto = new Date(data.tgl_foto)
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  if (tglFoto < today) {
    return NextResponse.json({ error: "Tanggal foto tidak boleh di masa lalu" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Re-cek slot availability sebelum insert (mencegah race condition)
  const { data: existingBookings, error: fetchError } = await supabase
    .from("bookings")
    .select("id, kode_booking, jam_mulai, jam_selesai, nama_client")
    .eq("tgl_foto", data.tgl_foto)
    .neq("status_sesi", "cancel")

  if (fetchError) {
    return NextResponse.json({ error: "Gagal memverifikasi ketersediaan slot" }, { status: 500 })
  }

  // 1 slot = 1 client: cek apakah ada booking yang overlap waktunya
  const bentrok = (existingBookings ?? []).find((b: { jam_mulai: string; jam_selesai: string }) => {
    const bMulai   = timeToMinutes(b.jam_mulai)
    const bSelesai = timeToMinutes(b.jam_selesai)
    return bMulai < selesaiMin && bSelesai > mulaiMenit
  }) as { kode_booking: string; jam_mulai: string; jam_selesai: string } | undefined

  if (bentrok) {
    return NextResponse.json(
      {
        error: `Maaf, slot ini baru saja terisi oleh client lain. Silakan pilih jam lain.`,
        bentrok: true,
        bentrok_dengan: `${bentrok.kode_booking} (${bentrok.jam_mulai}–${bentrok.jam_selesai})`,
      },
      { status: 409 }
    )
  }

  // Insert ke database
  const { data: inserted, error: insertError } = await supabase
    .from("bookings")
    .insert({
      kategori_sesi:      data.kategori_sesi,
      paket_id:           data.paket_id,
      nama_paket:         paket.nama,
      tgl_foto:           data.tgl_foto,
      jam_mulai:          data.jam_mulai,
      jam_selesai:        jamSelesai,
      nama_client:        data.nama_client,
      no_wa:              data.no_wa,
      email:              data.email ?? null,
      jumlah_orang:       data.jumlah_orang,
      background_dipilih: data.background_dipilih,
      subtotal_paket:     rincian.subtotalPaket,
      subtotal_addon:     rincian.subtotalAddon,
      total_tagihan:      rincian.total,
      catatan:            data.catatan ?? null,
      status_pembayaran:  "belum_dp",
      status_sesi:        "pending",
    })
    .select("id, kode_booking")
    .single()

  if (insertError) {
    return NextResponse.json({ error: "Gagal menyimpan booking. Silakan coba lagi." }, { status: 500 })
  }

  // Simpan detail add-on ke booking_addons (sumber kebenaran untuk laporan keuangan)
  const addonRows: Array<{
    booking_id: string
    jenis: string
    nama_item: string
    qty: number
    harga_satuan: number
    subtotal: number
    source: string
  }> = []

  if (data.addons.tambahanWaktu > 0) {
    addonRows.push({
      booking_id: inserted.id,
      jenis: "tambahan_waktu",
      nama_item: `Tambahan Waktu (${data.addons.tambahanWaktu * 10} menit)`,
      qty: data.addons.tambahanWaktu,
      harga_satuan: 150000,
      subtotal: data.addons.tambahanWaktu * 150000,
      source: "booking_awal",
    })
  }
  if (data.addons.tambahanOrang > 0) {
    addonRows.push({
      booking_id: inserted.id,
      jenis: "tambahan_orang",
      nama_item: `Tambahan Orang (${data.addons.tambahanOrang} orang)`,
      qty: data.addons.tambahanOrang,
      harga_satuan: 20000,
      subtotal: data.addons.tambahanOrang * 20000,
      source: "booking_awal",
    })
  }
  if (data.addons.tambahanBackground > 0) {
    addonRows.push({
      booking_id: inserted.id,
      jenis: "tambahan_background",
      nama_item: `Tambahan Background (${data.addons.tambahanBackground} background)`,
      qty: data.addons.tambahanBackground,
      harga_satuan: 100000,
      subtotal: data.addons.tambahanBackground * 100000,
      source: "booking_awal",
    })
  }
  if (data.addons.cetak12R) {
    addonRows.push({
      booking_id: inserted.id,
      jenis: "cetak_12r",
      nama_item: "Cetak 12R + Frame",
      qty: 1,
      harga_satuan: 150000,
      subtotal: 150000,
      source: "booking_awal",
    })
  }
  if (data.addons.cetak20R) {
    addonRows.push({
      booking_id: inserted.id,
      jenis: "cetak_20r",
      nama_item: "Cetak 20R + Frame",
      qty: 1,
      harga_satuan: 400000,
      subtotal: 400000,
      source: "booking_awal",
    })
  }

  if (addonRows.length > 0) {
    await supabase.from("booking_addons").insert(addonRows)
  }

  return NextResponse.json({
    success:      true,
    kode_booking: inserted.kode_booking,
    total_tagihan: rincian.total,
    dp_minimum:   rincian.dpMinimum,
    sisa_bayar:   rincian.sisaBayar,
    nama_paket:   paket.nama,
  })
}
