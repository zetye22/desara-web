import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// PATCH — update kategori
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { nama, tipe, icon, warna, aktif } = body as {
    nama?: string
    tipe?: string
    icon?: string
    warna?: string
    aktif?: boolean
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (nama !== undefined) updates.nama = nama
  if (tipe !== undefined) updates.tipe = tipe
  if (icon !== undefined) updates.icon = icon
  if (warna !== undefined) updates.warna = warna
  if (aktif !== undefined) updates.aktif = aktif

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("kategori_pengeluaran")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 })

  return NextResponse.json({ success: true, item })
}

// DELETE — hapus kategori
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("kategori_pengeluaran")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
