import { requireAdmin } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET — semua settings, opsional filter ?kategori=paket
export async function GET(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()
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
