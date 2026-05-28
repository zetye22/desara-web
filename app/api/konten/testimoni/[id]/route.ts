import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

async function requireAdmin() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  return user
}

// PATCH — update testimoni
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { nama, paket, teks, bintang, inisial, urutan, aktif } = body as {
    nama?: string; paket?: string; teks?: string; bintang?: number
    inisial?: string; urutan?: number; aktif?: boolean
  }

  const updateData: Record<string, unknown> = {}
  if (nama !== undefined)    updateData.nama    = nama.trim()
  if (paket !== undefined)   updateData.paket   = paket.trim()
  if (teks !== undefined)    updateData.teks    = teks.trim()
  if (bintang !== undefined) updateData.bintang = bintang
  if (inisial !== undefined) updateData.inisial = inisial.trim().slice(0, 3).toUpperCase()
  if (urutan !== undefined)  updateData.urutan  = urutan
  if (aktif !== undefined)   updateData.aktif   = aktif

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("testimoni")
    .update(updateData)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, item })
}

// DELETE — hapus testimoni
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("testimoni")
    .delete()
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
