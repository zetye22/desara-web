import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// Jenis addon yang valid
const VALID_JENIS = [
  "tambahan_waktu",
  "tambahan_orang",
  "tambahan_background",
  "cetak_12r",
  "cetak_20r",
  "lainnya",
]

// GET /api/bookings/[id]/addons
// Ambil semua addon untuk satu booking
export async function GET(
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

  const { data: addons, error } = await supabase
    .from("booking_addons")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data addon" },
      { status: 500 }
    )
  }

  return NextResponse.json({ addons: addons ?? [] })
}

// POST /api/bookings/[id]/addons
// Tambah addon baru (dari lapangan)
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

  let body: { jenis?: string; nama_item?: string; qty?: number; harga_satuan?: number; catatan?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 })
  }

  const { jenis, nama_item, qty, harga_satuan, catatan } = body

  // Validasi field wajib
  if (!jenis || !VALID_JENIS.includes(jenis)) {
    return NextResponse.json(
      { error: "Jenis addon tidak valid" },
      { status: 400 }
    )
  }
  if (!nama_item || typeof nama_item !== "string" || nama_item.trim() === "") {
    return NextResponse.json(
      { error: "Nama item wajib diisi" },
      { status: 400 }
    )
  }
  if (!qty || typeof qty !== "number" || qty < 1) {
    return NextResponse.json(
      { error: "Qty minimal 1" },
      { status: 400 }
    )
  }
  if (typeof harga_satuan !== "number" || harga_satuan < 0) {
    return NextResponse.json(
      { error: "Harga satuan tidak valid" },
      { status: 400 }
    )
  }

  // Pastikan booking ada
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id")
    .eq("id", bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json(
      { error: "Booking tidak ditemukan" },
      { status: 404 }
    )
  }

  const subtotal = qty * harga_satuan

  const { data: addon, error: insertError } = await supabase
    .from("booking_addons")
    .insert({
      booking_id: bookingId,
      jenis,
      nama_item: nama_item.trim(),
      qty,
      harga_satuan,
      subtotal,
      source: "lapangan",
      catatan: catatan ?? null,
      ditambahkan_oleh: user.id,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: "Gagal menambah addon" },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, addon })
}
