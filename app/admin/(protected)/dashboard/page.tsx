import { createAdminClient } from "@/lib/supabase/server"
import { KpiCards }           from "@/components/admin/dashboard/kpi-cards"
import { BookingTodayTable }  from "@/components/admin/dashboard/booking-today-table"
import { WeeklyChart }        from "@/components/admin/dashboard/weekly-chart"
import { ActionRequired }     from "@/components/admin/dashboard/action-required"
import { QuickStatsSidebar }  from "@/components/admin/dashboard/quick-stats"
import { DashboardRealtime }  from "@/components/admin/dashboard/dashboard-realtime"
import { formatTanggal }      from "@/lib/utils"
import type {
  BookingRow, KpiData, ChartPoint, ActionItem, QuickStats,
} from "@/components/admin/dashboard/types"

function jakartaDate(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Jakarta" }).format(d)
}

export default async function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const hariIni    = jakartaDate(0)
  const besok      = jakartaDate(1)
  const minggu7    = jakartaDate(7)
  const minggu14   = jakartaDate(-7)
  const bulanMulai = hariIni.slice(0, 7) + "-01"
  const hari7Lalu  = jakartaDate(-6)

  const [
    { data: bookingHari },
    { data: bookingMingguIni },
    { data: bookingMingguLalu },
    { data: bookingBulan },
    { data: bookingPendingDp },
    { data: booking7Hari },
    { data: bookingAction },
  ] = await Promise.all([
    supabase.from("bookings")
      .select("id,kode_booking,nama_client,no_wa,paket_id,nama_paket,tgl_foto,jam_mulai,jam_selesai,jumlah_orang,background_dipilih,status_sesi,status_pembayaran,total_tagihan,dp_dibayar,kategori_sesi,catatan,created_at")
      .eq("tgl_foto", hariIni)
      .neq("status_sesi", "cancel")
      .order("jam_mulai"),

    supabase.from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("tgl_foto", hariIni)
      .lte("tgl_foto", minggu7)
      .neq("status_sesi", "cancel"),

    supabase.from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("tgl_foto", minggu14)
      .lte("tgl_foto", jakartaDate(-1))
      .neq("status_sesi", "cancel"),

    supabase.from("bookings")
      .select("total_tagihan,nama_paket")
      .gte("tgl_foto", bulanMulai)
      .lte("tgl_foto", hariIni)
      .neq("status_sesi", "cancel"),

    supabase.from("bookings")
      .select("id,total_tagihan,nama_client,kode_booking,tgl_foto,jam_mulai,nama_paket,created_at")
      .eq("status_sesi", "pending"),

    supabase.from("bookings")
      .select("tgl_foto")
      .gte("tgl_foto", hari7Lalu)
      .lte("tgl_foto", hariIni)
      .neq("status_sesi", "cancel"),

    supabase.from("bookings")
      .select("id,kode_booking,nama_client,no_wa,tgl_foto,jam_mulai,nama_paket,status_sesi,status_pembayaran,created_at")
      .or(`tgl_foto.eq.${besok},status_sesi.eq.selesai_edit,and(status_pembayaran.eq.belum_dp,created_at.lte.${jakartaDate(-7)})`)
      .neq("status_sesi", "cancel"),
  ])

  // ── KPI ──────────────────────────────────────────────────────
  const bHari = (bookingHari ?? []) as BookingRow[]
  const kpi: KpiData = {
    bookingHariIni:         bHari.length,
    bookingHariIniLunas:    bHari.filter((b) => b.status_pembayaran === "lunas").length,
    bookingHariIniPending:  bHari.filter((b) => b.status_pembayaran === "belum_dp").length,
    bookingMingguIni:       (bookingMingguIni as unknown as { count?: number } | null)?.count ?? 0,
    bookingMingguLalu:      (bookingMingguLalu as unknown as { count?: number } | null)?.count ?? 0,
    omzetBulanIni:          (bookingBulan ?? []).reduce((s: number, b: { total_tagihan: number }) => s + b.total_tagihan, 0),
    jumlahBookingBulanIni:  (bookingBulan ?? []).length,
    pendingDp:              (bookingPendingDp ?? []).length,
    nilaiPendingDp:         (bookingPendingDp ?? []).reduce((s: number, b: { total_tagihan: number }) => s + b.total_tagihan, 0),
  }

  // ── Chart ─────────────────────────────────────────────────────
  const countByDate: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) countByDate[jakartaDate(-i)] = 0
  for (const b of (booking7Hari ?? []) as { tgl_foto: string }[]) {
    if (countByDate[b.tgl_foto] !== undefined) countByDate[b.tgl_foto]++
  }
  const chartData: ChartPoint[] = Object.entries(countByDate).map(([tgl, jumlah]) => ({
    tanggal: new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta", weekday: "short", day: "numeric",
    }).format(new Date(tgl + "T00:00:00")),
    jumlah,
  }))

  // ── Action items ──────────────────────────────────────────────
  const seen = new Set<string>()
  const uniqueActions: ActionItem[] = ((bookingAction ?? []) as {
    id: string; kode_booking: string; nama_client: string; no_wa: string
    tgl_foto: string; jam_mulai: string; nama_paket: string
    status_sesi: string; status_pembayaran: string; created_at: string
  }[])
    .map((b) => {
      let tipe: ActionItem["tipe"]
      if (b.tgl_foto === besok)              tipe = "reminder_besok"
      else if (b.status_sesi === "selesai_edit") tipe = "foto_siap"
      else                                   tipe = "dp_overdue"
      return { ...b, tipe }
    })
    .filter((a) => { if (seen.has(a.id)) return false; seen.add(a.id); return true })

  // ── Quick stats ───────────────────────────────────────────────
  const paketCount: Record<string, number> = {}
  let totalTagihanBulan = 0
  for (const b of (bookingBulan ?? []) as { nama_paket: string; total_tagihan: number }[]) {
    paketCount[b.nama_paket] = (paketCount[b.nama_paket] ?? 0) + 1
    totalTagihanBulan += b.total_tagihan
  }
  const jumlahBookingBulan = (bookingBulan ?? []).length
  const paketTerlaris = Object.entries(paketCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
  const quickStats: QuickStats = {
    paketTerlaris,
    rataTagihan:   jumlahBookingBulan > 0 ? Math.round(totalTagihanBulan / jumlahBookingBulan) : 0,
    rataHariIni:   jumlahBookingBulan / new Date().getDate(),
  }

  return (
    <>
      <DashboardRealtime />

      <div className="space-y-5">
        <KpiCards data={kpi} />

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-5">
          {/* Kolom kiri */}
          <div className="space-y-5">
            <WeeklyChart data={chartData} />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Jadwal Hari Ini — {formatTanggal(hariIni + "T00:00:00")}
              </p>
              <BookingTodayTable bookings={bHari} />
            </div>
          </div>

          {/* Sidebar kanan */}
          <div className="space-y-5">
            <QuickStatsSidebar stats={quickStats} />
            <ActionRequired items={uniqueActions} />
          </div>
        </div>
      </div>
    </>
  )
}
