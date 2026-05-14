import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — semua settings, opsional filter ?kategori=paket
export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { searchParams } = new URL(request.url)
  const kategori = searchParams.get("kategori")

  let query = supabase
    .from("settings")
    .select("key, value, kategori, deskripsi, updated_at")
    .order("key")

  if (kategori) query = query.eq("kategori", kategori)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: data ?? [] })
}
