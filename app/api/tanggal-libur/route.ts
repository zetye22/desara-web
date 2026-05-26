import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const { data, error } = await supabase
    .from("tanggal_libur")
    .select("id, tanggal, keterangan, created_at")
    .order("tanggal", { ascending: true })

  if (error) return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(request: NextRequest) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: { tanggal?: string; keterangan?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { tanggal, keterangan } = body
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    return NextResponse.json({ error: "Format tanggal tidak valid (YYYY-MM-DD)" }, { status: 400 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
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
