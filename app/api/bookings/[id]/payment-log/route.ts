import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await (createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("booking_payment_log")
    .select("*")
    .eq("booking_id", params.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ items: [] })

  return NextResponse.json({ items: data ?? [] })
}
