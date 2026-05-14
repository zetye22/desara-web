import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { sendWhatsApp } from "@/lib/fonnte"
import { generatePesan, ALL_TEMPLATES, type JenisTemplate } from "@/lib/wa-templates"

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { booking_id?: string; jenis_template?: string; pesan_custom?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { booking_id, jenis_template, pesan_custom } = body

  if (!booking_id) return NextResponse.json({ error: "booking_id wajib diisi" }, { status: 400 })

  if (jenis_template && jenis_template !== "custom" && !ALL_TEMPLATES.includes(jenis_template as JenisTemplate)) {
    return NextResponse.json({ error: "Template tidak valid" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Ambil data booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, nama_client, no_wa, nama_paket, tgl_foto, jam_mulai, jam_selesai, total_tagihan, dp_dibayar")
    .eq("id", booking_id)
    .single()

  if (!booking) return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })

  // Tentukan pesan yang akan dikirim
  const pesan = jenis_template === "custom"
    ? pesan_custom?.trim()
    : generatePesan(jenis_template as JenisTemplate, booking)

  if (!pesan) return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })

  // Log sebelum kirim
  const { data: logRow } = await supabase
    .from("notifikasi_log")
    .insert({
      booking_id,
      jenis: jenis_template ?? "custom",
      pesan,
      nomor_tujuan: booking.no_wa,
      status: "pending",
    })
    .select("id")
    .single()

  // Kirim via Fonnte
  const result = await sendWhatsApp(booking.no_wa, pesan)

  // Update log
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

  return NextResponse.json({ success: result.success, error: result.error, nomor: booking.no_wa })
}
