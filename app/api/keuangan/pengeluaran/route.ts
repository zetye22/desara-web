import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// Kategori pengeluaran yang valid
const KATEGORI_VALID = ["wifi", "pdam", "ipl", "listrik", "cetak", "upah", "lain"] as const
type KategoriPengeluaran = typeof KATEGORI_VALID[number]

// GET — List pengeluaran untuk satu periode: ?periode=YYYY-MM
export async function GET(request: NextRequest) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { searchParams } = new URL(request.url)
  const periode = searchParams.get("periode") ?? ""

  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Format periode tidak valid. Gunakan YYYY-MM" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("pengeluaran")
    .select("*")
    .eq("bulan_periode", periode)
    .order("tanggal", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}

// POST — Tambah pengeluaran baru
export async function POST(request: NextRequest) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tanggal, kategori, deskripsi, nominal, bulan_periode } = body as {
    tanggal?: string
    kategori?: string
    deskripsi?: string
    nominal?: number
    bulan_periode?: string
  }

  // Validasi field wajib
  if (!tanggal || !kategori || nominal === undefined || !bulan_periode) {
    return NextResponse.json({ error: "Field tanggal, kategori, nominal, dan bulan_periode wajib diisi" }, { status: 400 })
  }

  // Validasi tanggal
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(Date.parse(tanggal))) {
    return NextResponse.json({ error: "Format tanggal tidak valid. Gunakan YYYY-MM-DD" }, { status: 400 })
  }

  // Validasi kategori
  if (!KATEGORI_VALID.includes(kategori as KategoriPengeluaran)) {
    return NextResponse.json({ error: `Kategori tidak valid. Pilih salah satu: ${KATEGORI_VALID.join(", ")}` }, { status: 400 })
  }

  // Validasi nominal
  if (typeof nominal !== "number" || nominal <= 0) {
    return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 })
  }

  // Validasi format bulan_periode
  if (!/^\d{4}-\d{2}$/.test(bulan_periode)) {
    return NextResponse.json({ error: "Format bulan_periode tidak valid. Gunakan YYYY-MM" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("pengeluaran")
    .insert({
      tanggal,
      kategori,
      deskripsi: deskripsi ?? null,
      nominal: Math.round(nominal),
      bulan_periode,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, item })
}
