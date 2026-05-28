import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

// GET /api/cron/generate-pengeluaran-tetap
// Dipanggil Vercel Cron tanggal 1 setiap bulan jam 00:05 WIB (17:05 UTC hari sebelumnya)
// Auto-generate pengeluaran tetap ke bulan baru
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET tidak dikonfigurasi" }, { status: 500 })
  }
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Bulan sekarang (Jakarta, UTC+7)
  const now = new Date()
  const jakartaMs = now.getTime() + 7 * 60 * 60 * 1000
  const jakartaDate = new Date(jakartaMs)
  const bulan = jakartaDate.toISOString().slice(0, 7) // "YYYY-MM"

  const supabase = createAdminClient()

  const { data: posTetap, error: errTetap } = await supabase
    .from("pengeluaran_tetap")
    .select("id, kategori_id, nama, nominal")
    .eq("aktif", true)
    .order("urutan", { ascending: true })

  if (errTetap) {
    console.error("[cron/generate-pengeluaran-tetap]", errTetap.message)
    return NextResponse.json({ error: errTetap.message }, { status: 500 })
  }

  if (!posTetap || posTetap.length === 0) {
    return NextResponse.json({ bulan, generated: 0, message: "Tidak ada pos tetap aktif" })
  }

  // Cek yang sudah ada
  const { data: existing } = await supabase
    .from("pengeluaran")
    .select("recurring_id")
    .eq("bulan_periode", bulan)
    .eq("is_recurring", true)
    .not("recurring_id", "is", null)

  const sudahAda = new Set<string>(
    (existing ?? []).map((e: { recurring_id: string }) => e.recurring_id)
  )

  const tanggal = `${bulan}-01`
  const toInsert = posTetap
    .filter((p: { id: string }) => !sudahAda.has(p.id))
    .map((p: { id: string; kategori_id: string | null; nama: string; nominal: number }) => ({
      tanggal,
      kategori_id: p.kategori_id,
      deskripsi: p.nama,
      nominal: p.nominal,
      is_recurring: true,
      recurring_id: p.id,
    }))

  if (toInsert.length === 0) {
    return NextResponse.json({ bulan, generated: 0, skipped: posTetap.length })
  }

  const { data: inserted, error: errInsert } = await supabase
    .from("pengeluaran")
    .insert(toInsert)
    .select("id")

  if (errInsert) {
    console.error("[cron/generate-pengeluaran-tetap] insert error:", errInsert.message)
    return NextResponse.json({ error: errInsert.message }, { status: 500 })
  }

  console.log(`[cron/generate-pengeluaran-tetap] Generated ${inserted?.length} items for ${bulan}`)

  return NextResponse.json({
    bulan,
    generated: inserted?.length ?? toInsert.length,
    skipped: sudahAda.size,
  })
}
