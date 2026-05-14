export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — semua testimoni (publik, tanpa auth, untuk landing page)
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from("testimoni")
    .select("id, nama, paket, teks, bintang, inisial, urutan, aktif")
    .order("urutan")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

// POST — tambah testimoni baru (admin only)
export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { nama, paket, teks, bintang, inisial, urutan, aktif } = body as {
    nama?: string; paket?: string; teks?: string; bintang?: number
    inisial?: string; urutan?: number; aktif?: boolean
  }

  if (!nama?.trim() || !paket?.trim() || !teks?.trim() || !inisial?.trim()) {
    return NextResponse.json({ error: "Nama, paket, teks, dan inisial wajib diisi" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("testimoni")
    .insert({
      nama: nama.trim(),
      paket: paket.trim(),
      teks: teks.trim(),
      bintang: bintang ?? 5,
      inisial: inisial.trim().slice(0, 3).toUpperCase(),
      urutan: urutan ?? 0,
      aktif: aktif ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, item }, { status: 201 })
}
