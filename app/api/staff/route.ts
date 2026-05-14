export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from("staff_upah")
    .select("id, nama, role, upah_per_client")
    .eq("aktif", true)
    .order("nama")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = data ?? []
  return NextResponse.json({
    photographers: all.filter((s: { role: string }) => s.role === "photographer"),
    editors:       all.filter((s: { role: string }) => s.role === "editor"),
  })
}
