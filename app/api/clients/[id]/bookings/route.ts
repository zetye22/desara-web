import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

// GET — riwayat booking satu client berdasarkan no_wa
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Ambil no_wa dari clients table dulu
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("no_wa")
    .eq("id", params.id)
    .single()

  if (clientError || !client) {
    return NextResponse.json({ error: "Client tidak ditemukan" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("bookings")
    .select("id, tgl_foto, paket, nama_client, total_tagihan, dp_dibayar, status, created_at")
    .eq("no_wa", client.no_wa)
    .order("tgl_foto", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bookings: data ?? [] })
}
