import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB
const ALLOWED_TYPES  = ["image/jpeg", "image/png", "image/webp"]

export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const file         = formData.get("file") as File | null
  const kodeBooking  = formData.get("kode_booking") as string | null

  if (!file || !kodeBooking) {
    return NextResponse.json(
      { error: "File dan kode_booking harus disertakan" },
      { status: 400 }
    )
  }

  // Validasi file
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 5 MB" }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Format file harus JPG, PNG, atau WebP" },
      { status: 400 }
    )
  }
  if (!/^DSR-\d{8}-\d{3}$/.test(kodeBooking)) {
    return NextResponse.json({ error: "Format kode booking tidak valid" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Pastikan booking ada
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, status_sesi")
    .eq("kode_booking", kodeBooking)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking tidak ditemukan" }, { status: 404 })
  }
  if (booking.status_sesi === "cancel") {
    return NextResponse.json({ error: "Booking sudah dibatalkan" }, { status: 400 })
  }

  // Upload ke Supabase Storage
  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const fileName = `${kodeBooking}-${Date.now()}.${ext}`
  const buffer   = await file.arrayBuffer()

  const { data: uploaded, error: uploadError } = await supabase.storage
    .from("bukti-transfer")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 })
  }

  // Ambil public URL dari storage
  const { data: { publicUrl } } = supabase.storage
    .from("bukti-transfer")
    .getPublicUrl(uploaded.path)

  // Update URL di database
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ bukti_transfer_url: publicUrl })
    .eq("kode_booking", kodeBooking)

  if (updateError) {
    return NextResponse.json({ error: "Upload berhasil tapi gagal update database" }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: publicUrl })
}
