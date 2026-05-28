import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { timeToMinutes, generateSlotJam } from "@/lib/time-utils"

const SLOT_JAM = generateSlotJam()

type ExistingBooking = {
  id: string
  kode_booking: string
  jam_mulai: string
  jam_selesai: string
  nama_client: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tanggal         = searchParams.get("tanggal")
  const jamMulaiParam   = searchParams.get("jam_mulai")
  // Terima "durasi_menit" (baru) dan "durasi" (lama) agar backward-compatible
  const durasiMenit     = parseInt(
    searchParams.get("durasi_menit") ?? searchParams.get("durasi") ?? "0"
  )
  const excludeId       = searchParams.get("exclude_booking_id") ?? null

  if (!tanggal || !durasiMenit) {
    return NextResponse.json(
      { error: "Parameter kurang: tanggal dan durasi_menit wajib diisi" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  // Cek apakah tanggal ini diblokir sebagai hari libur
  const { data: liburData } = await supabase
    .from("tanggal_libur")
    .select("tanggal, keterangan")
    .eq("tanggal", tanggal)
    .maybeSingle()

  if (liburData) {
    const keterangan: string | null = liburData.keterangan ?? null
    const alasan = `Studio tutup${keterangan ? ` — ${keterangan}` : ""}`
    const slots = SLOT_JAM.map((jam) => ({ jam, available: false, alasan, bentrok_dengan: null }))
    return NextResponse.json({ slots, libur: true, keterangan })
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, kode_booking, jam_mulai, jam_selesai, nama_client")
    .eq("tgl_foto", tanggal)
    .neq("status_sesi", "cancel")
    .neq("status_sesi", "pending")

  if (error) {
    return NextResponse.json({ error: "Gagal cek ketersediaan" }, { status: 500 })
  }

  const existingList = ((bookings ?? []) as ExistingBooking[])
    .filter((b) => !excludeId || b.id !== excludeId)

  // Slot terisi jika ada booking lain yang MULAI di jam yang sama
  // (bukan overlap — setiap slot 30 menit boleh 1 client mulai, durasi tidak memblok slot berikutnya)
  function cekBentrok(slotMulai: number): ExistingBooking | null {
    for (const b of existingList) {
      if (timeToMinutes(b.jam_mulai) === slotMulai) return b
    }
    return null
  }

  // Waktu sekarang di Jakarta
  const nowJkt      = new Date()
  const jakartaDate = nowJkt.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  const jakartaTime = nowJkt.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit",
  })
  const isToday    = tanggal === jakartaDate
  const nowMinutes = timeToMinutes(jakartaTime)

  if (jamMulaiParam) {
    // Cek 1 slot spesifik
    const slotMulai   = timeToMinutes(jamMulaiParam)
    const slotSelesai = slotMulai + durasiMenit
    if (slotSelesai > timeToMinutes("21:00")) {
      return NextResponse.json({ available: false, alasan: "Melebihi jam operasional", bentrok_dengan: null })
    }
    if (isToday && slotMulai <= nowMinutes) {
      return NextResponse.json({ available: false, alasan: "Slot sudah lewat", bentrok_dengan: null })
    }
    const bentrok = cekBentrok(slotMulai)
    return NextResponse.json({
      available: !bentrok,
      alasan: bentrok
        ? `Slot bentrok dengan booking ${bentrok.kode_booking} (${bentrok.jam_mulai}–${bentrok.jam_selesai})`
        : null,
      bentrok_dengan: bentrok
        ? {
            kode_booking: bentrok.kode_booking,
            jam: `${bentrok.jam_mulai}–${bentrok.jam_selesai}`,
            nama_client: bentrok.nama_client,
          }
        : null,
    })
  }

  // Return semua slot untuk grid
  const slots = SLOT_JAM.map((slotJam) => {
    const slotMulai   = timeToMinutes(slotJam)
    const slotSelesai = slotMulai + durasiMenit

    if (slotSelesai > timeToMinutes("21:00")) {
      return { jam: slotJam, available: false, alasan: "Melebihi jam operasional", bentrok_dengan: null }
    }
    if (isToday && slotMulai <= nowMinutes) {
      return { jam: slotJam, available: false, alasan: "Slot sudah lewat", bentrok_dengan: null }
    }

    const bentrok = cekBentrok(slotMulai)
    return {
      jam: slotJam,
      available: !bentrok,
      alasan: bentrok
        ? `Sudah ada booking ${bentrok.jam_mulai}–${bentrok.jam_selesai}`
        : null,
      bentrok_dengan: bentrok
        ? {
            kode_booking: bentrok.kode_booking,
            jam: `${bentrok.jam_mulai}–${bentrok.jam_selesai}`,
            nama_client: bentrok.nama_client,
          }
        : null,
    }
  })

  return NextResponse.json({ slots })
}
