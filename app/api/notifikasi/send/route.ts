import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { kirimNotifikasi, fetchBookingForNotif } from "@/lib/notifikasi-server"
import { ALL_TEMPLATES, type JenisTemplate } from "@/lib/wa-templates"

export async function POST(request: NextRequest) {
  // Cek autentikasi admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { booking_id?: string; jenis_template?: string; pesan_custom?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { booking_id, jenis_template, pesan_custom } = body

  if (!booking_id) {
    return NextResponse.json({ error: "booking_id wajib diisi" }, { status: 400 })
  }

  // Validasi jenis template (kecuali custom)
  if (jenis_template && jenis_template !== "custom" && !ALL_TEMPLATES.includes(jenis_template as JenisTemplate)) {
    return NextResponse.json({ error: "Template tidak valid" }, { status: 400 })
  }

  // Ambil data booking
  const booking = await fetchBookingForNotif(booking_id)
  if (!booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
  }

  // Kirim custom pesan langsung via Fonnte + log
  if (jenis_template === "custom") {
    if (!pesan_custom?.trim()) {
      return NextResponse.json({ error: "pesan_custom wajib diisi" }, { status: 400 })
    }

    const { sendWhatsApp } = await import("@/lib/fonnte")
    const { createAdminClient } = await import("@/lib/supabase/server")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any

    // Log dulu
    const { data: logRow } = await supabase
      .from("notifikasi_log")
      .insert({
        booking_id,
        jenis: "custom",
        pesan: pesan_custom.trim(),
        nomor_tujuan: booking.no_wa,
        status: "pending",
      })
      .select("id")
      .single()

    const result = await sendWhatsApp(booking.no_wa, pesan_custom.trim())

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

    return NextResponse.json({
      success: result.success,
      error: result.error,
      nomor: booking.no_wa,
    })
  }

  // Kirim dengan template
  const result = await kirimNotifikasi(booking, jenis_template as JenisTemplate)

  return NextResponse.json({
    success: result.success,
    error: result.error,
    nomor: booking.no_wa,
  })
}
