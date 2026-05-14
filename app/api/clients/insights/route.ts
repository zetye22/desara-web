export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

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
