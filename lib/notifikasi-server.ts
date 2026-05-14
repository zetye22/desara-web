// Helper server-side: kirim notifikasi WA + log ke notifikasi_log
// Import hanya di server (API routes, server components)

import { createAdminClient } from "@/lib/supabase/server"
import { sendWhatsApp } from "@/lib/fonnte"
import {
  generatePesan,
  getJumlahFoto,
  formatSisa,
  TEMPLATE_TO_JENIS,
  type JenisTemplate,
} from "@/lib/wa-templates"
import { formatTanggal } from "@/lib/utils"

interface BookingForNotif {
  id: string
  nama_client: string
  no_wa: string
  tgl_foto: string
  jam_mulai: string
  nama_paket: string
  total_tagihan: number
  dp_dibayar: number
}

// Kirim WA + simpan log. Tidak throw — selalu return result.
export async function kirimNotifikasi(
  booking: BookingForNotif,
  jenis: JenisTemplate
): Promise<{ success: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const pesan = generatePesan(jenis, {
    nama: booking.nama_client.split(" ")[0], // gunakan nama depan saja
    tanggal_lengkap: formatTanggal(booking.tgl_foto),
    jam: booking.jam_mulai,
    paket: booking.nama_paket,
    sisa: formatSisa(booking.total_tagihan, booking.dp_dibayar),
    jumlah_foto: getJumlahFoto(booking.nama_paket),
  })

  // Insert log awal status pending
  const { data: logRow, error: logError } = await supabase
    .from("notifikasi_log")
    .insert({
      booking_id: booking.id,
      jenis: TEMPLATE_TO_JENIS[jenis],
      pesan,
      nomor_tujuan: booking.no_wa,
      status: "pending",
    })
    .select("id")
    .single()

  if (logError) {
    console.error("[notifikasi] gagal insert log:", logError.message)
    // Tetap kirim WA meskipun log gagal
  }

  // Kirim via Fonnte
  const result = await sendWhatsApp(booking.no_wa, pesan)

  // Update status log
  if (logRow?.id) {
    await supabase
      .from("notifikasi_log")
      .update({
        status: result.success ? "sent" : "failed",
        error_message: result.error ?? null,
        sent_at: result.success ? new Date().toISOString() : null,
      })
      .eq("id", logRow.id)
  }

  return result
}

// Fetch data booking lengkap untuk notifikasi
export async function fetchBookingForNotif(
  bookingId: string
): Promise<BookingForNotif | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, nama_client, no_wa, tgl_foto, jam_mulai, nama_paket, total_tagihan, dp_dibayar"
    )
    .eq("id", bookingId)
    .single()

  if (error || !data) return null
  return data as BookingForNotif
}
