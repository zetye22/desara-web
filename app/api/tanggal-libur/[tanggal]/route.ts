import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireOwner } from "@/lib/auth-server"

export async function DELETE(
  _: NextRequest,
  { params }: { params: { tanggal: string } }
) {
  const guard = await requireOwner()
  if (guard) return guard

  const { tanggal } = params
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tanggal_libur")
    .delete()
    .eq("tanggal", tanggal)

  if (error) return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 })
  return NextResponse.json({ success: true })
}
