import { requireAdmin } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// PATCH — Update urutan portfolio secara bulk (auth required)
export async function PATCH(request: NextRequest) {
  // Cek autentikasi
  const guard = await requireAdmin()
  if (guard) return guard

  let body: { items: { id: string; urutan: number }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Items wajib diisi" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Update setiap row secara sequential
  for (const { id, urutan } of body.items) {
    const { error } = await supabase
      .from("portfolio")
      .update({ urutan, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
