import { requireAdmin } from "@/lib/auth-server"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// POST — perbaiki bukti_transfer_url lama yang masih berupa path relatif
export async function POST() {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()

  // Ambil semua booking yang punya bukti_transfer_url tapi bukan URL lengkap
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("id, bukti_transfer_url")
    .not("bukti_transfer_url", "is", null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let fixed = 0
  const BUCKET = "bukti-transfer"

  for (const b of bookings ?? []) {
    const url: string = b.bukti_transfer_url
    // Skip jika sudah berupa URL lengkap
    if (url.startsWith("http")) continue

    // Generate public URL dari path yang tersimpan
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(url)

    await supabase
      .from("bookings")
      .update({ bukti_transfer_url: publicUrl })
      .eq("id", b.id)

    fixed++
  }

  return NextResponse.json({ success: true, fixed, total: bookings?.length ?? 0 })
}
