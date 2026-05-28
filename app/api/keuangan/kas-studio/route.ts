import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { periode?: string; saldo_awal?: number; persen_investor?: number }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  const { periode, saldo_awal, persen_investor } = body
  if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Format periode tidak valid" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("kas_studio")
    .upsert(
      {
        periode,
        saldo_awal: saldo_awal ?? 0,
        persen_investor: persen_investor ?? 50,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "periode" }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
