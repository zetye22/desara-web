import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// PATCH — Edit metadata foto (auth required)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Ambil hanya field yang diizinkan untuk diupdate
  const updateData: Record<string, unknown> = {}
  if (body.alt_text !== undefined) updateData.alt_text = body.alt_text
  if (body.caption !== undefined) updateData.caption = body.caption
  if (body.kategori !== undefined) updateData.kategori = body.kategori
  if (body.aktif !== undefined) updateData.aktif = body.aktif
  updateData.updated_at = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("portfolio")
    .update(updateData)
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE — Hapus foto (auth required)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  // Ambil image_url dari DB untuk hapus dari storage
  const { data: row } = await supabase
    .from("portfolio")
    .select("image_url")
    .eq("id", id)
    .single()

  // Hapus dari storage jika URL ada (best effort)
  if (row?.image_url) {
    const marker = "/storage/v1/object/public/portfolio/"
    const markerIndex = row.image_url.indexOf(marker)
    if (markerIndex !== -1) {
      const storagePath = row.image_url.slice(markerIndex + marker.length)
      // Hapus dari storage — abaikan error jika gagal
      await supabase.storage.from("portfolio").remove([storagePath]).catch(() => {})
    }
  }

  // Hapus dari tabel portfolio
  const { error } = await supabase
    .from("portfolio")
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
