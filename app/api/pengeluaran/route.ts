import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list pengeluaran: ?bulan=YYYY-MM
export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { searchParams } = new URL(request.url)
  const bulan = searchParams.get("bulan") ?? ""

  if (bulan && !/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ error: "Format bulan tidak valid. Gunakan YYYY-MM" }, { status: 400 })
  }

  let query = supabase
    .from("pengeluaran")
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .order("tanggal", { ascending: false })

  if (bulan) query = query.eq("bulan_periode", bulan)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST — tambah pengeluaran baru
export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tanggal, kategori_id, deskripsi, nominal, catatan, bukti_url, is_recurring, recurring_id } = body as {
    tanggal?: string
    kategori_id?: string
    deskripsi?: string
    nominal?: number
    catatan?: string
    bukti_url?: string
    is_recurring?: boolean
    recurring_id?: string
  }

  if (!tanggal || nominal === undefined) {
    return NextResponse.json({ error: "Field tanggal dan nominal wajib diisi" }, { status: 400 })
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(Date.parse(tanggal))) {
    return NextResponse.json({ error: "Format tanggal tidak valid. Gunakan YYYY-MM-DD" }, { status: 400 })
  }

  if (typeof nominal !== "number" || nominal <= 0) {
    return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 })
  }

  // bulan_periode di-set otomatis oleh trigger DB
  const { data: item, error } = await supabase
    .from("pengeluaran")
    .insert({
      tanggal,
      kategori_id: kategori_id ?? null,
      deskripsi: deskripsi ?? null,
      nominal: Math.round(nominal),
      catatan: catatan ?? null,
      bukti_url: bukti_url ?? null,
      is_recurring: is_recurring ?? false,
      recurring_id: recurring_id ?? null,
    })
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, item }, { status: 201 })
}
