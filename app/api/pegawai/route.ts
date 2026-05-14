export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list semua pegawai tetap
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data, error } = await supabase
    .from("pegawai_tetap")
    .select("*")
    .order("aktif", { ascending: false })
    .order("nama", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST — tambah pegawai baru
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

  const { nama, posisi, gaji_bulanan, tanggal_gajian, no_wa, no_rekening, bank, tanggal_mulai, catatan } = body as {
    nama?: string
    posisi?: string
    gaji_bulanan?: number
    tanggal_gajian?: number
    no_wa?: string
    no_rekening?: string
    bank?: string
    tanggal_mulai?: string
    catatan?: string
  }

  if (!nama?.trim()) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 })
  if (!posisi?.trim()) return NextResponse.json({ error: "Posisi wajib diisi" }, { status: 400 })
  if (!gaji_bulanan || gaji_bulanan <= 0) return NextResponse.json({ error: "Gaji harus lebih dari 0" }, { status: 400 })

  const tglGajian = tanggal_gajian ?? 1
  if (tglGajian < 1 || tglGajian > 28) {
    return NextResponse.json({ error: "Tanggal gajian harus antara 1–28" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("pegawai_tetap")
    .insert({
      nama: nama.trim(),
      posisi: posisi.trim(),
      gaji_bulanan,
      tanggal_gajian: tglGajian,
      no_wa: no_wa?.trim() || null,
      no_rekening: no_rekening?.trim() || null,
      bank: bank?.trim() || null,
      tanggal_mulai: tanggal_mulai || new Date().toISOString().split("T")[0],
      catatan: catatan?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, item: data })
}
