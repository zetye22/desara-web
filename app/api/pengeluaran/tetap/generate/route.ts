import { requireAdmin } from "@/lib/auth-server"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

function labelBulanStr(bulan: string): string {
  const [year, month] = bulan.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date)
}

// POST — generate pengeluaran tetap + gaji pegawai untuk satu bulan
// Body: { bulan: "YYYY-MM" }
export async function POST(request: NextRequest) {
  const guard = await requireAdmin()
  if (guard) return guard

  const supabase = createAdminClient()

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "Format request tidak valid" }, { status: 400 })
  }

  const { bulan } = body as { bulan?: string }

  if (!bulan || !/^\d{4}-\d{2}$/.test(bulan)) {
    return NextResponse.json({ error: "Format bulan tidak valid. Gunakan YYYY-MM" }, { status: 400 })
  }

  // Cek semua recurring_id yang sudah ada bulan ini
  const { data: existing } = await supabase
    .from("pengeluaran")
    .select("recurring_id")
    .eq("bulan_periode", bulan)
    .eq("is_recurring", true)
    .not("recurring_id", "is", null)

  const sudahDigenerate = new Set<string>(
    (existing ?? []).map((e: { recurring_id: string }) => e.recurring_id)
  )

  // ── Pos Tetap ──────────────────────────────────────────────────────────────
  const { data: posTetap, error: errTetap } = await supabase
    .from("pengeluaran_tetap")
    .select("*, kategori_pengeluaran(id, nama)")
    .eq("aktif", true)
    .order("urutan", { ascending: true })

  if (errTetap) return NextResponse.json({ error: errTetap.message }, { status: 500 })

  const tanggal1 = `${bulan}-01`
  const posTetapInsert = (posTetap ?? [])
    .filter((p: { id: string }) => !sudahDigenerate.has(p.id))
    .map((p: { id: string; kategori_id: string | null; nama: string; nominal: number }) => ({
      tanggal: tanggal1,
      bulan_periode: bulan,
      kategori: "lain",
      kategori_id: p.kategori_id ?? null,
      deskripsi: p.nama,
      nominal: p.nominal,
      is_recurring: true,
      recurring_id: p.id,
    }))

  // ── Gaji Pegawai Tetap ─────────────────────────────────────────────────────
  const [year, month] = bulan.split("-").map(Number)
  const hariTerakhir = new Date(year, month, 0).getDate()
  const labelBulan = labelBulanStr(bulan)

  // Ambil kategori "Gaji"
  const { data: kategoriGaji } = await supabase
    .from("kategori_pengeluaran")
    .select("id")
    .eq("nama", "Gaji")
    .single()

  const { data: pegawai, error: errPegawai } = await supabase
    .from("pegawai_tetap")
    .select("id, nama, posisi, gaji_bulanan, tanggal_gajian")
    .eq("aktif", true)

  if (errPegawai) return NextResponse.json({ error: errPegawai.message }, { status: 500 })

  const gajiInsert = (pegawai ?? [])
    .filter((p: { id: string }) => !sudahDigenerate.has(p.id))
    .map((p: { id: string; nama: string; posisi: string; gaji_bulanan: number; tanggal_gajian: number }) => {
      const tgl = Math.min(p.tanggal_gajian, hariTerakhir)
      return {
        tanggal: `${bulan}-${String(tgl).padStart(2, "0")}`,
        bulan_periode: bulan,
        kategori: "lain",
        kategori_id: kategoriGaji?.id ?? null,
        deskripsi: `Gaji ${p.posisi} - ${p.nama} - ${labelBulan}`,
        nominal: p.gaji_bulanan,
        is_recurring: true,
        recurring_id: p.id,
      }
    })

  // ── Insert semua ───────────────────────────────────────────────────────────
  const allInsert = [...posTetapInsert, ...gajiInsert]

  if (allInsert.length === 0) {
    const totalSkipped = (posTetap?.length ?? 0) + (pegawai?.length ?? 0)
    return NextResponse.json({
      success: true,
      generated: 0,
      skipped: totalSkipped,
      generatedGaji: 0,
      message: `Semua ${totalSkipped} item sudah di-generate untuk ${bulan}`,
    })
  }

  const { data: inserted, error: errInsert } = await supabase
    .from("pengeluaran")
    .insert(allInsert)
    .select("id, deskripsi, nominal")

  if (errInsert) return NextResponse.json({ error: errInsert.message }, { status: 500 })

  const generatedGaji = gajiInsert.length
  const generatedPos = posTetapInsert.length
  const skipped = ((posTetap?.length ?? 0) - generatedPos) + ((pegawai?.length ?? 0) - generatedGaji)

  return NextResponse.json({
    success: true,
    generated: inserted?.length ?? allInsert.length,
    generatedGaji,
    skipped,
    items: inserted,
  })
}
