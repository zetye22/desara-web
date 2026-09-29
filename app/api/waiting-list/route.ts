import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createWaitingListSchema } from "@/lib/waiting-list-schema"
import { SEMUA_PAKET } from "@/lib/constants"
import { hitungHarga } from "@/lib/harga-booking"
import { requireAdmin } from "@/lib/auth-server"

// Rate limiter sederhana: max 5 pendaftaran per IP per 10 menit
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 10 * 60 * 1000
  const current = rateLimitMap.get(ip)

  if (!current || now > current.resetAt) {
    if (rateLimitMap.size > 200) {
      rateLimitMap.forEach((val, key) => {
        if (now > val.resetAt) rateLimitMap.delete(key)
      })
    }
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (current.count >= 5) return false
  current.count++
  return true
}

// GET: Ambil daftar waiting list (hanya untuk Admin)
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") // 'menunggu', 'dijadwalkan', 'batal', atau null (semua)

  const supabase = createAdminClient()
  let query = supabase
    .from("waiting_list")
    .select("*")
    .order("created_at", { ascending: false })

  if (status && ["menunggu", "dijadwalkan", "batal"].includes(status)) {
    query = query.eq("status", status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ waiting_list: data ?? [] })
}

// POST: Public submission form waiting list
export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa menit." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const parsed = createWaitingListSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", detail: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const data = parsed.data

  // Verifikasi paket
  const paket = SEMUA_PAKET.find((p) => p.id === data.paket_id)
  if (!paket) {
    return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 400 })
  }
  if (paket.kategori !== data.kategori_sesi) {
    return NextResponse.json({ error: "Kategori tidak sesuai paket" }, { status: 400 })
  }

  // Hitung perkiraan harga di server
  const rincian = hitungHarga(data.paket_id, data.addons)

  const supabase = createAdminClient()
  const { data: inserted, error: insertError } = await supabase
    .from("waiting_list")
    .insert({
      kategori_sesi: data.kategori_sesi,
      paket_id: data.paket_id,
      nama_paket: paket.nama,
      nama_client: data.nama_client,
      no_wa: data.no_wa,
      email: data.email ?? null,
      jumlah_orang: data.jumlah_orang,
      background_dipilih: data.background_dipilih,
      addons: data.addons,
      subtotal_paket: rincian.subtotalPaket,
      subtotal_addon: rincian.subtotalAddon,
      total_tagihan: rincian.total,
      preferensi_jadwal: data.preferensi_jadwal ?? null,
      catatan: data.catatan ?? null,
      status: "menunggu",
    })
    .select("id")
    .single()

  if (insertError) {
    console.error("Error inserting waiting list:", insertError)
    return NextResponse.json(
      { error: "Gagal menyimpan pendaftaran waiting list. Silakan coba lagi." },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    id: inserted.id,
    nama_client: data.nama_client,
    no_wa: data.no_wa,
    nama_paket: paket.nama,
    total_tagihan: rincian.total,
    dp_minimum: rincian.dpMinimum,
  })
}
