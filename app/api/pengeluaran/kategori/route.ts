export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list semua kategori
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("kategori_pengeluaran")
    .select("*")
    .order("urutan", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplikasi berdasarkan nama (case-insensitive), simpan record pertama
  const seen = new Set<string>()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unique = (data ?? []).filter((k: any) => {
    const key = k.nama?.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return NextResponse.json({ items: unique })
}

// POST — tambah kategori baru
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

  const { nama, tipe, icon, warna } = body as {
    nama?: string
    tipe?: string
    icon?: string
    warna?: string
  }

  if (!nama) return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 })

  const TIPE_VALID = ["operasional", "hpp", "aset"]
  if (tipe && !TIPE_VALID.includes(tipe)) {
    return NextResponse.json({ error: "Tipe tidak valid" }, { status: 400 })
  }

  // Cek duplikat sebelum insert
  const { data: existing } = await supabase
    .from("kategori_pengeluaran")
    .select("id")
    .ilike("nama", nama.trim())
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Kategori "${nama}" sudah ada` }, { status: 409 })
  }

  const { data: item, error } = await supabase
    .from("kategori_pengeluaran")
    .insert({
      nama,
      tipe: tipe ?? "operasional",
      icon: icon ?? "receipt",
      warna: warna ?? "#6B7280",
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, item }, { status: 201 })
}
