import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

// PATCH — Bulk update portfolio (auth required)
// Body: { ids: string[], action: "aktifkan" | "nonaktifkan" | "hapus" }
export async function PATCH(request: NextRequest) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { ids: string[]; action: "aktifkan" | "nonaktifkan" | "hapus" }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "IDs wajib diisi" }, { status: 400 })
  }

  const validActions = ["aktifkan", "nonaktifkan", "hapus"]
  if (!validActions.includes(body.action)) {
    return NextResponse.json({ error: "Action tidak valid" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient()

  if (body.action === "hapus") {
    // Ambil semua image_url terlebih dahulu
    const { data: rows } = await supabase
      .from("portfolio")
      .select("image_url")
      .in("id", body.ids)

    // Hapus dari storage (best effort)
    if (rows && rows.length > 0) {
      const marker = "/storage/v1/object/public/portfolio/"
      const storagePaths: string[] = []
      for (const row of rows) {
        if (row.image_url) {
          const markerIndex = row.image_url.indexOf(marker)
          if (markerIndex !== -1) {
            storagePaths.push(row.image_url.slice(markerIndex + marker.length))
          }
        }
      }
      if (storagePaths.length > 0) {
        await supabase.storage.from("portfolio").remove(storagePaths).catch(() => {})
      }
    }

    // Hapus dari DB
    const { error } = await supabase
      .from("portfolio")
      .delete()
      .in("id", body.ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Aktifkan atau non-aktifkan
    const aktif = body.action === "aktifkan"
    const { error } = await supabase
      .from("portfolio")
      .update({ aktif, updated_at: new Date().toISOString() })
      .in("id", body.ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
