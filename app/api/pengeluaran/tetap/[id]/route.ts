import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// PATCH — update pos tetap
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { nama, nominal, kategori_id, catatan, aktif } = body as {
    nama?: string
    nominal?: number
    kategori_id?: string | null
    catatan?: string | null
    aktif?: boolean
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (nama !== undefined) updates.nama = nama
  if (nominal !== undefined) {
    if (typeof nominal !== "number" || nominal < 0) {
      return NextResponse.json({ error: "Nominal tidak valid" }, { status: 400 })
    }
    updates.nominal = Math.round(nominal)
  }
  if (kategori_id !== undefined) updates.kategori_id = kategori_id
  if (catatan !== undefined) updates.catatan = catatan
  if (aktif !== undefined) updates.aktif = aktif

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("pengeluaran_tetap")
    .update(updates)
    .eq("id", params.id)
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })

  return NextResponse.json({ success: true, item })
}

// DELETE — hapus pos tetap
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { error } = await supabase
    .from("pengeluaran_tetap")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
