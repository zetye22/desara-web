import { NextRequest, NextResponse } from "next/server"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import type {
  BookingRingkas,
  LaporanData,
  PengeluaranRow,
  AddonRow,
  DetailAddonLapangan,
  AddonInsight,
} from "@/components/admin/keuangan/types"

// HPP cetak yang include di paket
const HARGA_CETAK_12R = 150000
const HARGA_CETAK_20R = 400000

// Format label bulan dari "YYYY-MM" → "Jan 2026"
function labelBulan(periode: string): string {
  const [year, month] = periode.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" }).format(date)
}

// Hitung periode N bulan sebelumnya
function periodeSebelumnya(periode: string, n: number): string {
  const [year, month] = periode.split("-").map(Number)
  const date = new Date(year, month - 1 - n, 1)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

// Hitung data laporan dari bookings + pengeluaran + addons
function hitungLaporan(
  bookings: BookingRingkas[],
  pengeluaranRows: PengeluaranRow[],
  periode: string,
  addons: AddonRow[] = [],
  posTetap: PosTetapItem[] = []
): Omit<LaporanData, "tren6Bulan" | "comparison"> {
  // Pisahkan pos tetap: gaji vs operasional
  const biayaTetap = posTetap.filter((p) => p.kategoriNama !== "Gaji")
  const gajiTetap  = posTetap.filter((p) => p.kategoriNama === "Gaji")
  // ── Pemasukan ──────────────────────────────────────────────────────────────
  const mapKategori = new Map<string, { jumlah: number; total: number; totalAddon: number }>()
  let totalPemasukan = 0
  let totalPaket = 0

  for (const b of bookings) {
    const key = b.kategori_sesi
    const existing = mapKategori.get(key) ?? { jumlah: 0, total: 0, totalAddon: 0 }
    existing.jumlah += 1
    existing.total += b.total_tagihan
    existing.totalAddon += b.subtotal_addon
    mapKategori.set(key, existing)
    totalPemasukan += b.total_tagihan
    totalPaket += b.subtotal_paket
  }

  const perKategori = Array.from(mapKategori.entries()).map(([kategori, val]) => ({
    kategori,
    jumlah: val.jumlah,
    total: val.total,
    rata: val.jumlah > 0 ? Math.round(val.total / val.jumlah) : 0,
  }))

  // ── Split add-on: booking_awal vs lapangan ─────────────────────────────────
  const addonAwalItems = addons.filter((a) => a.source === "booking_awal")
  const addonLapanganItems = addons.filter((a) => a.source === "lapangan")
  const addonBookingAwal = addonAwalItems.reduce((s, a) => s + a.subtotal, 0)
  const addonLapangan = addonLapanganItems.reduce((s, a) => s + a.subtotal, 0)

  // Fallback ke subtotal_addon dari bookings jika addons tidak diambil
  const totalAddon = addons.length > 0
    ? addonBookingAwal + addonLapangan
    : bookings.reduce((s, b) => s + b.subtotal_addon, 0)

  // ── Detail & Insight Add-on Lapangan ──────────────────────────────────────
  const lapanganMap = new Map<string, DetailAddonLapangan>()
  for (const a of addonLapanganItems) {
    const key = a.jenis
    const existing = lapanganMap.get(key) ?? {
      jenis: a.jenis,
      namaItem: a.nama_item,
      jumlah: 0,
      totalRevenue: 0,
    }
    existing.jumlah += a.qty
    existing.totalRevenue += a.subtotal
    lapanganMap.set(key, existing)
  }
  const detailAddonLapangan = Array.from(lapanganMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  )

  const bookingIdsAdaAddon = new Set(addonLapanganItems.map((a) => a.booking_id))
  const jumlahBookingAdaAddon = bookingIdsAdaAddon.size
  const addonInsight: AddonInsight = {
    totalRevenueLapangan: addonLapangan,
    pctDariPemasukan: totalPemasukan > 0 ? addonLapangan / totalPemasukan : 0,
    avgPerBookingAdaAddon:
      jumlahBookingAdaAddon > 0
        ? Math.round(addonLapangan / jumlahBookingAdaAddon)
        : 0,
    topItem: detailAddonLapangan[0]?.namaItem ?? null,
    jumlahBookingAdaAddon,
    totalBooking: bookings.length,
  }

  // ── Gaji pegawai tetap dari pengeluaran_tetap (kategori Gaji) ─────────────
  const totalGaji   = gajiTetap.reduce((s, p) => s + p.nominal, 0)

  // ── Pengeluaran manual (semua dari tabel pengeluaran = lainnya) ────────────
  const lainnyaRows = pengeluaranRows

  // ── HPP Fotografer (dari snapshot upah di bookings) ─────────────────────────
  const pgMap = new Map<string, { jumlah: number; total: number }>()
  for (const b of bookings) {
    if (b.pg1?.nama && b.upah_pg1 > 0) {
      const e = pgMap.get(b.pg1.nama) ?? { jumlah: 0, total: 0 }
      e.jumlah += 1; e.total += b.upah_pg1
      pgMap.set(b.pg1.nama, e)
    }
    if (b.pg2?.nama && b.upah_pg2 > 0) {
      const e = pgMap.get(b.pg2.nama) ?? { jumlah: 0, total: 0 }
      e.jumlah += 1; e.total += b.upah_pg2
      pgMap.set(b.pg2.nama, e)
    }
  }
  const fotograferHpp = Array.from(pgMap.entries()).map(([nama, v]) => ({
    nama,
    jumlah: v.jumlah,
    upahPerClient: v.jumlah > 0 ? Math.round(v.total / v.jumlah) : 0,
    total: v.total,
  }))

  // ── HPP Editor (dari snapshot upah di bookings) ──────────────────────────────
  const edMap = new Map<string, { jumlah: number; total: number }>()
  for (const b of bookings) {
    if (b.ed?.nama && b.upah_editor > 0) {
      const e = edMap.get(b.ed.nama) ?? { jumlah: 0, total: 0 }
      e.jumlah += 1; e.total += b.upah_editor
      edMap.set(b.ed.nama, e)
    }
  }
  const editorHpp = Array.from(edMap.entries()).map(([nama, v]) => ({
    nama,
    jumlah: v.jumlah,
    upahPerClient: v.jumlah > 0 ? Math.round(v.total / v.jumlah) : 0,
    total: v.total,
  }))

  const totalBooking = bookings.length

  // ── HPP Cetak (dari paket Silver/Gold + dari add-on cetak) ─────────────────
  const jumlahSilver = bookings.filter((b) => b.nama_paket.includes("Silver")).length
  const jumlahGold = bookings.filter((b) => b.nama_paket.includes("Gold")).length

  // Cetak dari add-on (semua source: booking_awal dan lapangan)
  const addonCetak12R = addons
    .filter((a) => a.jenis === "cetak_12r")
    .reduce((s, a) => s + a.qty, 0)
  const addonCetak20R = addons
    .filter((a) => a.jenis === "cetak_20r")
    .reduce((s, a) => s + a.qty, 0)

  const totalCetak12R = jumlahSilver + addonCetak12R
  const totalCetak20R = jumlahGold + addonCetak20R

  const cetakHpp = []
  if (totalCetak12R > 0) {
    cetakHpp.push({
      jenis: "Cetak 12R",
      jumlah: totalCetak12R,
      hargaSatuan: HARGA_CETAK_12R,
      total: totalCetak12R * HARGA_CETAK_12R,
    })
  }
  if (totalCetak20R > 0) {
    cetakHpp.push({
      jenis: "Cetak 20R",
      jumlah: totalCetak20R,
      hargaSatuan: HARGA_CETAK_20R,
      total: totalCetak20R * HARGA_CETAK_20R,
    })
  }

  const totalHpp =
    fotograferHpp.reduce((s, f) => s + f.total, 0) +
    editorHpp.reduce((s, e) => s + e.total, 0) +
    cetakHpp.reduce((s, c) => s + c.total, 0)

  // ── Operasional (dari pengeluaran_tetap aktif di database) ────────────────
  const totalOperasional = biayaTetap.reduce((s, b) => s + b.nominal, 0)

  // ── Pengeluaran Lainnya (non-gaji) ─────────────────────────────────────────
  const totalLainnya = lainnyaRows.reduce((s, p) => s + p.nominal, 0)

  const totalPengeluaran = totalHpp + totalOperasional + totalGaji + totalLainnya

  // ── Laba & Margin ───────────────────────────────────────────────────────────
  const laba = totalPemasukan - totalPengeluaran
  const margin = totalPemasukan > 0 ? laba / totalPemasukan : 0

  return {
    periode,
    pemasukan: {
      perKategori,
      totalPaket,
      addonBookingAwal: addons.length > 0 ? addonBookingAwal : 0,
      addonLapangan: addons.length > 0 ? addonLapangan : 0,
      totalAddon,
      total: totalPemasukan,
      totalBooking,
    },
    pengeluaran: {
      hpp: {
        fotografer: fotograferHpp,
        editor: editorHpp,
        cetak: cetakHpp,
      },
      operasional: {
        biayaTetap,
      },
      gajiPegawaiTetap: {
        items: gajiTetap.map((p) => ({ deskripsi: p.nama, nominal: p.nominal })),
        total: totalGaji,
      },
      lainnya: lainnyaRows,
      totalHpp,
      totalOperasional,
      totalGaji,
      totalLainnya,
      total: totalPengeluaran,
    },
    laba,
    margin,
    detailAddonLapangan,
    addonInsight,
  }
}

interface PosTetapItem {
  nama: string
  nominal: number
  kategoriNama: string | null
}

// Ambil semua pos tetap aktif dari pengeluaran_tetap (dengan kategori)
async function fetchPosTetap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<PosTetapItem[]> {
  const { data } = await supabase
    .from("pengeluaran_tetap")
    .select("nama, nominal, kategori_pengeluaran(nama)")
    .eq("aktif", true)
    .order("urutan", { ascending: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((d: any) => ({
    nama:          d.nama,
    nominal:       d.nominal,
    kategoriNama:  d.kategori_pengeluaran?.nama ?? null,
  }))
}

// Ambil bookings dari Supabase untuk satu periode
async function fetchBookings(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  periode: string
): Promise<BookingRingkas[]> {
  const [yearStr, monthStr] = periode.split("-")
  const year = Number(yearStr)
  const month = Number(monthStr)
  const tglMulai = `${yearStr}-${monthStr}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const tglAkhir = `${yearStr}-${monthStr}-${String(lastDay).padStart(2, "0")}`

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, kategori_sesi, nama_paket, total_tagihan, subtotal_paket, subtotal_addon, tgl_foto, " +
      "upah_pg1, upah_pg2, upah_editor, photographer_1_id, photographer_2_id, editor_id"
    )
    .gte("tgl_foto", tglMulai)
    .lte("tgl_foto", tglAkhir)
    .neq("status_sesi", "cancel")

  if (error) throw new Error(error.message)
  const rows: {
    id: string; kategori_sesi: string; nama_paket: string; total_tagihan: number
    subtotal_paket: number; subtotal_addon: number; tgl_foto: string
    upah_pg1: number; upah_pg2: number; upah_editor: number
    photographer_1_id: string | null; photographer_2_id: string | null; editor_id: string | null
  }[] = data ?? []

  // Kumpulkan semua staff_id unik lalu ambil nama-nya sekaligus
  const staffIds = new Set<string>()
  for (const b of rows) {
    if (b.photographer_1_id) staffIds.add(b.photographer_1_id)
    if (b.photographer_2_id) staffIds.add(b.photographer_2_id)
    if (b.editor_id)         staffIds.add(b.editor_id)
  }

  const staffMap = new Map<string, string>()
  if (staffIds.size > 0) {
    const { data: staffData } = await supabase
      .from("staff_upah")
      .select("id, nama")
      .in("id", Array.from(staffIds))
    for (const s of (staffData ?? [])) staffMap.set(s.id, s.nama)
  }

  return rows.map((b) => ({
    id:             b.id,
    kategori_sesi:  b.kategori_sesi,
    nama_paket:     b.nama_paket,
    total_tagihan:  b.total_tagihan,
    subtotal_paket: b.subtotal_paket,
    subtotal_addon: b.subtotal_addon,
    tgl_foto:       b.tgl_foto,
    upah_pg1:       b.upah_pg1   ?? 0,
    upah_pg2:       b.upah_pg2   ?? 0,
    upah_editor:    b.upah_editor ?? 0,
    pg1: b.photographer_1_id ? { id: b.photographer_1_id, nama: staffMap.get(b.photographer_1_id) ?? "?" } : null,
    pg2: b.photographer_2_id ? { id: b.photographer_2_id, nama: staffMap.get(b.photographer_2_id) ?? "?" } : null,
    ed:  b.editor_id          ? { id: b.editor_id,         nama: staffMap.get(b.editor_id)         ?? "?" } : null,
  }))
}

// Ambil pengeluaran manual dari Supabase untuk satu periode
async function fetchPengeluaran(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  periode: string
): Promise<PengeluaranRow[]> {
  const { data, error } = await supabase
    .from("pengeluaran")
    .select("*, kategori_pengeluaran(id, nama)")
    .eq("bulan_periode", periode)
    .order("tanggal", { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

// Ambil semua add-on untuk daftar booking ID
async function fetchAddonsByBookingIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  bookingIds: string[]
): Promise<AddonRow[]> {
  if (bookingIds.length === 0) return []

  const { data, error } = await supabase
    .from("booking_addons")
    .select("id, booking_id, jenis, nama_item, qty, harga_satuan, subtotal, source, catatan")
    .in("booking_id", bookingIds)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function GET(request: NextRequest) {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { searchParams } = new URL(request.url)
  const periode = searchParams.get("periode") ?? ""
  const withCompare = searchParams.get("compare") === "true"

  // Validasi format periode
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    return NextResponse.json({ error: "Format periode tidak valid. Gunakan YYYY-MM" }, { status: 400 })
  }

  try {
    // Ambil data paralel: bookings + pengeluaran + pos tetap + tren 6 bulan
    const periode6Bulan = Array.from({ length: 6 }, (_, i) => periodeSebelumnya(periode, 5 - i))

    const [bookings, pengeluaran, posTetap, ...tren6Results] = await Promise.all([
      fetchBookings(supabase, periode),
      fetchPengeluaran(supabase, periode),
      fetchPosTetap(supabase),
      ...periode6Bulan.map(async (p) => {
        const [b, e] = await Promise.all([
          fetchBookings(supabase, p),
          fetchPengeluaran(supabase, p),
        ])
        return { periode: p, bookings: b, pengeluaran: e }
      }),
    ])

    // Ambil add-on untuk periode utama (detail breakdown & HPP akurat)
    const bookingIds = bookings.map((b) => b.id)
    const addons = await fetchAddonsByBookingIds(supabase, bookingIds)

    // Hitung laporan utama dengan addon detail
    const laporan = hitungLaporan(bookings, pengeluaran, periode, addons, posTetap)

    // Hitung tren 6 bulan (tanpa addon detail untuk performa)
    const tren6Bulan = tren6Results.map((t) => {
      const l = hitungLaporan(t.bookings, t.pengeluaran, t.periode, [], posTetap)
      return {
        periode: t.periode,
        label: labelBulan(t.periode),
        pemasukan: l.pemasukan.total,
        pengeluaran: l.pengeluaran.total,
        laba: l.laba,
      }
    })

    // Comparison dengan bulan lalu
    let comparison: LaporanData["comparison"] = undefined
    if (withCompare) {
      const periodeLalu = periodeSebelumnya(periode, 1)
      const [bookingsLalu, pengeluaranLalu] = await Promise.all([
        fetchBookings(supabase, periodeLalu),
        fetchPengeluaran(supabase, periodeLalu),
      ])
      const laporanLalu = hitungLaporan(bookingsLalu, pengeluaranLalu, periodeLalu, [], posTetap)

      const deltaPemasukan = laporan.pemasukan.total - laporanLalu.pemasukan.total
      const deltaPengeluaran = laporan.pengeluaran.total - laporanLalu.pengeluaran.total
      const deltaLaba = laporan.laba - laporanLalu.laba

      comparison = {
        pemasukan: {
          nilai: laporanLalu.pemasukan.total,
          delta: deltaPemasukan,
          pct: laporanLalu.pemasukan.total > 0 ? deltaPemasukan / laporanLalu.pemasukan.total : 0,
        },
        pengeluaran: {
          nilai: laporanLalu.pengeluaran.total,
          delta: deltaPengeluaran,
          pct: laporanLalu.pengeluaran.total > 0 ? deltaPengeluaran / laporanLalu.pengeluaran.total : 0,
        },
        laba: {
          nilai: laporanLalu.laba,
          delta: deltaLaba,
          pct: laporanLalu.laba !== 0 ? deltaLaba / Math.abs(laporanLalu.laba) : 0,
        },
      }
    }

    const result: LaporanData = {
      ...laporan,
      tren6Bulan,
      comparison,
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
