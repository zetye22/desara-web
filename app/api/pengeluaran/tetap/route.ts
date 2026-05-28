export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list semua pos tetap
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("pengeluaran_tetap")
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .order("urutan", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST — tambah pos tetap baru
export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { nama, nominal, kategori_id, catatan } = body as {
    nama?: string
    nominal?: number
    kategori_id?: string
    catatan?: string
  }

  if (!nama || nominal === undefined) {
    return NextResponse.json({ error: "Field nama dan nominal wajib diisi" }, { status: 400 })
  }

  if (typeof nominal !== "number" || nominal < 0) {
    return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("pengeluaran_tetap")
    .insert({
      nama,
      nominal: Math.round(nominal),
      kategori_id: kategori_id ?? null,
      catatan: catatan ?? null,
    })
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, item }, { status: 201 })
}
