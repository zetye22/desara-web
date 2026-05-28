import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { requireOwner } from "@/lib/auth-server"

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("tanggal_libur")
    .select("id, tanggal, keterangan, created_at")
    .order("tanggal", { ascending: true })

  if (error) return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: NextRequest) {
  const guard = await requireOwner()
  if (guard) return guard

  let body: { tanggal?: string; keterangan?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tanggal, keterangan } = body
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("tanggal_libur")
    .insert({ tanggal, keterangan: keterangan ?? null })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Tanggal ini sudah ada di daftar libur" }, { status: 409 })
    }
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
