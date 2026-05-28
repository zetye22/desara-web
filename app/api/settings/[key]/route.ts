import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// DELETE — hapus satu setting row (untuk hapus paket)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { key: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from("admin_profiles").select("role").eq("user_id", user.id).single()
  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Hanya Owner yang bisa menghapus pengaturan" }, { status: 403 })
  }

  const { error } = await supabase.from("settings").delete().eq("key", params.key)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath("/")
  revalidatePath("/booking")

  return NextResponse.json({ success: true })
}

// PATCH — update satu setting
export async function PATCH(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Cek role — hanya owner yang bisa update settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Hanya Owner yang bisa mengubah pengaturan" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { value } = body as { value?: unknown }
  if (value === undefined) {
    return NextResponse.json({ error: "Field value wajib diisi" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("settings")
    .update({ value, updated_by: user.id })
    .eq("key", params.key)
    .select("key, value, kategori, updated_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: "Setting tidak ditemukan" }, { status: 404 })

  // Invalidate cache landing page & booking setelah update paket/addon/operasional
  const kategoriYangAffectPublic = ["paket", "addon", "umum"]
  if (kategoriYangAffectPublic.includes(item.kategori)) {
    revalidatePath("/")
    revalidatePath("/booking")
  }

  return NextResponse.json({ success: true, item })
}
