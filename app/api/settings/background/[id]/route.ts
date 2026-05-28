import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"

async function checkOwner(userId: string, supabase: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).from("admin_profiles").select("role").eq("user_id", userId).single()
  return data?.role === "owner"
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()
  if (!await checkOwner(user.id, supabase)) {
    return NextResponse.json({ error: "Hanya Owner yang bisa mengubah pengaturan" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { nama, warna, aktif, urutan } = body as {
    nama?: string; warna?: string; aktif?: boolean; urutan?: number
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {}
  if (nama !== undefined) updates.nama = nama
  if (warna !== undefined) updates.warna = warna
  if (aktif !== undefined) updates.aktif = aktif
  if (urutan !== undefined) updates.urutan = urutan

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Tidak ada yang diupdate" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("studio_backgrounds")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!item) return NextResponse.json({ error: "Background tidak ditemukan" }, { status: 404 })

  revalidatePath("/")
  revalidatePath("/booking")

  return NextResponse.json({ success: true, item })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()
  if (!await checkOwner(user.id, supabase)) {
    return NextResponse.json({ error: "Hanya Owner yang bisa mengubah pengaturan" }, { status: 403 })
  }

  const { error } = await supabase.from("studio_backgrounds").delete().eq("id", params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath("/")
  revalidatePath("/booking")

  return NextResponse.json({ success: true })
}
