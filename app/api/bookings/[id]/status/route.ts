import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth-server"

const VALID_STATUS_SESI = ["pending", "booked", "selesai_foto", "selesai_edit", "diambil", "cancel"]

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdmin()
  if (guard) return guard

  let body: { status_sesi?: string; status_pembayaran?: string; dp_dibayar?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Format tidak valid" }, { status: 400 })
  }

  if (body.status_sesi && !VALID_STATUS_SESI.includes(body.status_sesi)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.status_sesi)                     updateData.status_sesi       = body.status_sesi
  if (body.status_pembayaran)               updateData.status_pembayaran = body.status_pembayaran
  if (typeof body.dp_dibayar === "number")  updateData.dp_dibayar        = body.dp_dibayar

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada field yang diupdate" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
