import { requireAdmin } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// PATCH — Update pengeluaran (deskripsi, nominal, atau kategori)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cek autentikasi
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()

  const { id } = params
  if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { deskripsi, nominal, kategori } = body as {
    deskripsi?: string
    nominal?: number
    kategori?: string
  }

  // Bangun objek update (hanya field yang diberikan)
  const updateData: Record<string, unknown> = {}

  if (deskripsi !== undefined) updateData.deskripsi = deskripsi

  if (kategori !== undefined) {
    const KATEGORI_VALID = ["wifi", "pdam", "ipl", "listrik", "cetak", "upah", "lain"]
    if (!KATEGORI_VALID.includes(kategori)) {
      return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 })
    }
    updateData.kategori = kategori
  }

  if (nominal !== undefined) {
    if (typeof nominal !== "number" || nominal <= 0) {
      return NextResponse.json({ error: "Nominal harus lebih dari 0" }, { status: 400 })
    }
    updateData.nominal = Math.round(nominal)
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("pengeluaran")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, item })
}

// DELETE — Hapus pengeluaran
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cek autentikasi
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()

  const { id } = params
  if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })

  const { error } = await supabase
    .from("pengeluaran")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
