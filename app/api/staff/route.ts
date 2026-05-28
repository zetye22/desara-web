export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("staff_upah")
    .select("id, nama, role, upah_per_client")
    .eq("aktif", true)
    .order("nama")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduplikasi berdasarkan nama (case-insensitive), pertahankan yang menggunakan huruf kapital
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function dedupStaff(list: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = new Map<string, any>()
    for (const s of list) {
      const key = (s.nama as string).toLowerCase().trim()
      const existing = map.get(key)
      if (!existing) {
        map.set(key, s)
      } else {
        // Hitung jumlah huruf kapital — simpan yang lebih banyak kapitalnya
        const countCaps = (str: string) => (str.match(/[A-Z]/g) ?? []).length
        if (countCaps(s.nama) > countCaps(existing.nama)) {
          map.set(key, s)
        }
      }
    }
    return Array.from(map.values())
  }

  const all = dedupStaff(data ?? [])
  return NextResponse.json({
    photographers: all.filter((s: { role: string }) => s.role === "photographer"),
    editors:       all.filter((s: { role: string }) => s.role === "editor"),
    all,
  })
}
