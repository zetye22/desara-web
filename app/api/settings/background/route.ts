export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list semua backgrounds
export async function GET() {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("studio_backgrounds")
    .select("*")
    .order("urutan", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}

// POST — tambah background baru
export async function POST(request: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  // Cek role
  const { data: profile } = await supabase
    .from("admin_profiles").select("role").eq("user_id", user.id).single()
  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Hanya Owner yang bisa mengubah pengaturan" }, { status: 403 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { nama, warna } = body as { nama?: string; warna?: string }
  if (!nama) return NextResponse.json({ error: "Nama background wajib diisi" }, { status: 400 })

  const { data: item, error } = await supabase
    .from("studio_backgrounds")
    .insert({ nama, warna: warna ?? "#CCCCCC" })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath("/")
  revalidatePath("/booking")

  return NextResponse.json({ success: true, item }, { status: 201 })
}
