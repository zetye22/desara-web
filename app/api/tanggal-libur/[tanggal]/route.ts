import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function DELETE(
  _: NextRequest,
  { params }: { params: { tanggal: string } }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { tanggal } = params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { error } = await supabase
    .from("tanggal_libur")
    .delete()
    .eq("tanggal", tanggal)

  if (error) return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 })
  return NextResponse.json({ success: true })
}
