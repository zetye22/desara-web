import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("booking_reschedule_log")
    .select("id, tgl_foto_lama, jam_mulai_lama, jam_selesai_lama, tgl_foto_baru, jam_mulai_baru, jam_selesai_baru, alasan, created_at")
    .eq("booking_id", params.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
