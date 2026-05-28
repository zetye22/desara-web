import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// PATCH — update data pegawai
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

  const allowed = ["nama", "posisi", "gaji_bulanan", "tanggal_gajian", "no_wa", "no_rekening", "bank", "aktif", "tanggal_mulai", "tanggal_berhenti", "catatan"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    const val = (body as Record<string, unknown>)[key]
    if (val !== undefined) updates[key] = val
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("pegawai_tetap")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, item: data })
}

// DELETE — nonaktifkan (soft delete) atau hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const mode = searchParams.get("mode") ?? "nonaktif"

  const supabase = createAdminClient()

  if (mode === "hard") {
    const { error } = await supabase.from("pegawai_tetap").delete().eq("id", params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, mode: "deleted" })
  }

  // Nonaktifkan
  const { data, error } = await supabase
    .from("pegawai_tetap")
    .update({
      aktif: false,
      tanggal_berhenti: new Date().toISOString().split("T")[0],
    })
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, item: data })
}
