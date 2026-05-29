import { requireAdmin } from "@/lib/auth-server"
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET() {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()

  const cutoff6Bulan = new Date()
  cutoff6Bulan.setMonth(cutoff6Bulan.getMonth() - 6)
  const cutoffStr = cutoff6Bulan.toISOString().split("T")[0]

  const cutoff1Bulan = new Date()
  cutoff1Bulan.setMonth(cutoff1Bulan.getMonth() - 1)
  const cutoff1BulanStr = cutoff1Bulan.toISOString().split("T")[0]

  const [
    { count: totalClients },
    { count: vipCount },
    { count: inactiveCount },
    { count: blacklistCount },
    { count: newThisMonth },
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("is_blacklist", false),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .or("total_booking.gte.6,total_spending.gte.2000000")
      .eq("is_blacklist", false),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .lt("last_booking_date", cutoffStr)
      .eq("is_blacklist", false),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("is_blacklist", true),
    supabase.from("clients").select("id", { count: "exact", head: true })
      .gte("created_at", cutoff1BulanStr),
  ])

  return NextResponse.json({
    totalClients: totalClients ?? 0,
    vipCount: vipCount ?? 0,
    inactiveCount: inactiveCount ?? 0,
    blacklistCount: blacklistCount ?? 0,
    newThisMonth: newThisMonth ?? 0,
  })
}
