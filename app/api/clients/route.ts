import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — list clients dengan filter + pagination
// ?search=nama|wa  &tags=VIP,Loyal  &booking_min=1 &booking_max=5
// &spending_min=0  &spending_max=500000
// &inactive_bulan=3  &blacklist=false|true
// &page=1  &limit=30  &sort=total_spending&order=desc
export async function GET(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const p = new URL(request.url).searchParams

  const search       = p.get("search") ?? ""
  const tags         = p.get("tags")?.split(",").filter(Boolean) ?? []
  const bookingMin   = parseInt(p.get("booking_min") ?? "0") || 0
  const bookingMax   = parseInt(p.get("booking_max") ?? "0") || 0
  const spendingMin  = parseInt(p.get("spending_min") ?? "0") || 0
  const spendingMax  = parseInt(p.get("spending_max") ?? "0") || 0
  const inaktifBulan = parseInt(p.get("inactive_bulan") ?? "0") || 0
  const blacklist    = p.get("blacklist") // "true" | "false" | null
  const page         = Math.max(1, parseInt(p.get("page") ?? "1"))
  const limit        = Math.min(50, parseInt(p.get("limit") ?? "30"))
  const sort         = p.get("sort") ?? "last_booking_date"
  const order        = p.get("order") === "asc"

  let query = supabase
    .from("clients")
    .select("*", { count: "exact" })

  // Filter search
  if (search) {
    query = query.or(`nama.ilike.%${search}%,no_wa.ilike.%${search}%`)
  }

  // Filter blacklist
  if (blacklist === "true")  query = query.eq("is_blacklist", true)
  if (blacklist === "false") query = query.eq("is_blacklist", false)

  // Filter tags (client harus punya semua tag yang diminta)
  if (tags.length > 0) {
    query = query.contains("tags", tags)
  }

  // Filter booking count
  if (bookingMin > 0) query = query.gte("total_booking", bookingMin)
  if (bookingMax > 0) query = query.lte("total_booking", bookingMax)

  // Filter spending
  if (spendingMin > 0) query = query.gte("total_spending", spendingMin)
  if (spendingMax > 0) query = query.lte("total_spending", spendingMax)

  // Filter inactive (last booking lebih dari X bulan lalu)
  if (inaktifBulan > 0) {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - inaktifBulan)
    query = query.lt("last_booking_date", cutoff.toISOString().split("T")[0])
  }

  // Sort + Pagination
  query = query
    .order(sort, { ascending: order, nullsFirst: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items:      data ?? [],
    total:      count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
