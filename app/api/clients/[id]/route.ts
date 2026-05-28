import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — satu client lengkap
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 })

  return NextResponse.json({ client: data })
}

// PATCH — update tags, catatan, blacklist
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tags, catatan, is_blacklist, alasan_blacklist, nama, email } = body as {
    tags?: string[]
    catatan?: string | null
    is_blacklist?: boolean
    alasan_blacklist?: string | null
    nama?: string
    email?: string | null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (tags !== undefined)            updates.tags = tags
  if (catatan !== undefined)         updates.catatan = catatan
  if (is_blacklist !== undefined)    updates.is_blacklist = is_blacklist
  if (alasan_blacklist !== undefined) updates.alasan_blacklist = alasan_blacklist
  if (nama !== undefined)            updates.nama = nama
  if (email !== undefined)           updates.email = email

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, client: data })
}

// DELETE — hapus/anonymize client beserta semua booking terkait
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "anonymize" // "anonymize" | "hard"

  const supabase = createAdminClient()

  // Ambil no_wa client sebelum dihapus, untuk cari booking terkait
  const { data: clientData, error: fetchErr } = await supabase
    .from("clients")
    .select("no_wa")
    .eq("id", params.id)
    .single()

  if (fetchErr || !clientData) {
    return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 })
  }

  const noWa = clientData.no_wa as string

  if (mode === "anonymize") {
    const anonTag = `DIHAPUS_${params.id.slice(0, 8)}`

    // Anonimkan data personal di semua booking terkait
    await supabase
      .from("bookings")
      .update({ nama_client: anonTag, no_wa: anonTag, email: null })
      .eq("no_wa", noWa)

    // Anonimkan record client: hapus data personal, simpan statistik
    const { error } = await supabase
      .from("clients")
      .update({
        nama:    anonTag,
        no_wa:   anonTag,
        email:   null,
        catatan: null,
        tags:    [],
      })
      .eq("id", params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, mode: "anonymized" })
  } else {
    // Hard delete: hapus semua booking terkait dulu, lalu hapus client
    await supabase.from("bookings").delete().eq("no_wa", noWa)

    const { error } = await supabase.from("clients").delete().eq("id", params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, mode: "deleted" })
  }
}
