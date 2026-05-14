import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// POST — upsert satu setting (untuk tambah data baru yang belum ada)
export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data: profile } = await supabase
    .from("admin_profiles").select("role").eq("user_id", user.id).single()
  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Hanya Owner yang bisa mengubah pengaturan" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { key, value, kategori, deskripsi } = body as {
    key?: string; value?: unknown; kategori?: string; deskripsi?: string
  }

  if (!key || value === undefined) {
    return NextResponse.json({ error: "Field key dan value wajib diisi" }, { status: 400 })
  }

  const { data: item, error } = await supabase
    .from("settings")
    .upsert({
      key,
      value,
      kategori: kategori ?? "umum",
      deskripsi: deskripsi ?? null,
      updated_by: user.id,
    }, { onConflict: "key" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const kategoriPublic = ["paket", "addon", "umum"]
  if (kategoriPublic.includes(kategori ?? "umum")) {
    revalidatePath("/")
    revalidatePath("/booking")
  }

  return NextResponse.json({ success: true, item }, { status: 201 })
}
