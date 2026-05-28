import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — riwayat perubahan settings
// ?key=paket_wisuda_bronze  (opsional, filter by key)
// ?limit=50
export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)

  let query = supabase
    .from("settings_log")
    .select(`
      id, setting_key, value_lama, value_baru, diubah_pada,
      admin_profiles!inner(nama, role)
    `)
    .order("diubah_pada", { ascending: false })
    .limit(limit)

  if (key) query = query.eq("setting_key", key)

  const { data, error } = await query

  if (error) {
    // Fallback kalau join gagal (admin_profiles mungkin tidak ada)
    const { data: simple, error: e2 } = await supabase
      .from("settings_log")
      .select("id, setting_key, value_lama, value_baru, diubah_pada, diubah_oleh")
      .order("diubah_pada", { ascending: false })
      .limit(limit)

    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
    return NextResponse.json({ items: simple ?? [] })
  }

  return NextResponse.json({ items: data ?? [] })
}
