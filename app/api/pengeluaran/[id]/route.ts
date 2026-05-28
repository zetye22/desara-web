import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireOwner } from "@/lib/auth-server"

// PATCH — update pengeluaran (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireOwner()
  if (guard) return guard

  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tanggal, kategori_id, deskripsi, nominal, catatan, bukti_url } = body as {
    tanggal?: string
    kategori_id?: string | null
    deskripsi?: string | null
    nominal?: number
    catatan?: string | null
    bukti_url?: string | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (tanggal !== undefined) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || isNaN(Date.parse(tanggal))) {
      return NextResponse.json({ error: "Format tanggal tidak valid" }, { status: 400 })
    }
    updates.tanggal = tanggal
  }
  if (kategori_id !== undefined) updates.kategori_id = kategori_id
  if (deskripsi !== undefined) updates.deskripsi = deskripsi
  if (nominal !== undefined) {
    if (typeof nominal !== "number" || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 })
    }
    updates.nominal = Math.round(nominal)
  }
  if (catatan !== undefined) updates.catatan = catatan
  if (bukti_url !== undefined) updates.bukti_url = bukti_url

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("pengeluaran")
    .update(updates)
    .eq("id", params.id)
    .select("*, kategori_pengeluaran(id, nama, tipe, icon, warna)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 })

  return NextResponse.json({ success: true, item })
}

// DELETE — hapus pengeluaran (owner only)
export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireOwner()
  if (guard) return guard

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("pengeluaran")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
