import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

interface StaffBody {
  pg1_staff_id?:       string | null
  pg2_staff_id?:       string | null
  editor_staff_id?:    string | null
  upah_pg1?:           number
  upah_pg2?:           number
  upah_editor?:        number
  pg1_custom_nama?:    string
  pg2_custom_nama?:    string
  editor_custom_nama?: string
}

// Cari staff by nama+role, buat baru jika belum ada
async function findOrCreateStaff(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  nama: string,
  role: "photographer" | "editor",
  upah: number
): Promise<string> {
  const { data: existing } = await supabase
    .from("staff_upah")
    .select("id")
    .eq("nama", nama.trim())
    .eq("role", role)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from("staff_upah")
    .insert({ nama: nama.trim(), role, upah_per_client: upah, aktif: true })
    .select("id")
    .single()

  if (error) throw new Error(`Gagal buat staff: ${error.message}`)
  return created.id
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: StaffBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  // Resolve custom staff (find or create di staff_upah)
  let pg1Id    = body.pg1_staff_id    ?? null
  let pg2Id    = body.pg2_staff_id    ?? null
  let editorId = body.editor_staff_id ?? null

  try {
    if (body.pg1_custom_nama?.trim()) {
      pg1Id = await findOrCreateStaff(supabase, body.pg1_custom_nama, "photographer", body.upah_pg1 ?? 0)
    }
    if (body.pg2_custom_nama?.trim()) {
      pg2Id = await findOrCreateStaff(supabase, body.pg2_custom_nama, "photographer", body.upah_pg2 ?? 0)
    }
    if (body.editor_custom_nama?.trim()) {
      editorId = await findOrCreateStaff(supabase, body.editor_custom_nama, "editor", body.upah_editor ?? 0)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal membuat staff baru"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  // Upah 0 jika tidak ada staff yang ditugaskan
  const upah_pg1    = pg1Id    ? (body.upah_pg1    ?? 0) : 0
  const upah_pg2    = pg2Id    ? (body.upah_pg2    ?? 0) : 0
  const upah_editor = editorId ? (body.upah_editor ?? 0) : 0

  // Update booking — kirim upah eksplisit agar trigger DB tidak override
  const { error } = await supabase
    .from("bookings")
    .update({
      photographer_1_id: pg1Id,
      photographer_2_id: pg2Id,
      editor_id:         editorId,
      upah_pg1,
      upah_pg2,
      upah_editor,
    })
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: "Gagal menyimpan penugasan" }, { status: 500 })

  return NextResponse.json({
    success:   true,
    pg1_id:    pg1Id,
    pg2_id:    pg2Id,
    editor_id: editorId,
  })
}
