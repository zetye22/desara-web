"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import type { LaporanData } from "./types"
import { KpiCards }           from "./kpi-cards"
import { Charts }             from "./charts"
import { TabelPemasukan }     from "./tabel-pemasukan"
import { TabelPengeluaran }   from "./tabel-pengeluaran"
import { TabelSaldoBerjalan } from "./tabel-saldo-berjalan"
import { TabelPembayaran }    from "./tabel-pembayaran"
import { CardBagiHasil }      from "./card-bagi-hasil"
import { ExportButtons }      from "./export-buttons"

const TAHUN_OPTIONS = [2024, 2025, 2026, 2027]
const BULAN_OPTIONS = [
  { value: "01", label: "Jan" }, { value: "02", label: "Feb" },
  { value: "03", label: "Mar" }, { value: "04", label: "Apr" },
  { value: "05", label: "Mei" }, { value: "06", label: "Jun" },
  { value: "07", label: "Jul" }, { value: "08", label: "Agu" },
  { value: "09", label: "Sep" }, { value: "10", label: "Okt" },
  { value: "11", label: "Nov" }, { value: "12", label: "Des" },
]

const TABS = [
  { id: "ringkasan",   label: "Ringkasan" },
  { id: "pemasukan",   label: "Pemasukan" },
  { id: "pengeluaran", label: "Pengeluaran" },
  { id: "pembayaran",  label: "DP & Pelunasan" },
  { id: "aruskas",     label: "Arus Kas" },
  { id: "bagihasil",   label: "Bagi Hasil" },
] as const

type TabId = typeof TABS[number]["id"]

function labelBulanPanjang(periode: string): string {
  const [year, month] = periode.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
}

export function KeuanganClient({ initialPeriode }: { initialPeriode: string }) {
  const [tahun, setTahun]         = useState(initialPeriode.split("-")[0])
  const [bulan, setBulan]         = useState(initialPeriode.split("-")[1])
  const [tab, setTab]             = useState<TabId>("ringkasan")
  const [showComparison, setComp] = useState(false)
  const [data, setData]           = useState<LaporanData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const periode = `${tahun}-${bulan}`

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res  = await fetch(`/api/keuangan/laporan?periode=${periode}&compare=${showComparison}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Gagal memuat laporan"); return }
      setData(json)
    } catch {
      setError("Gagal terhubung ke server")
    } finally {
      setLoading(false)
    }
  }, [periode, showComparison])

  useEffect(() => { fetchData() }, [fetchData])

  const labelPeriode = labelBulanPanjang(periode)

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f3c]">Laporan Keuangan</h1>
          <p className="text-sm text-gray-400 mt-0.5">Analisis keuangan Desara Home Studio</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-3 h-9 shadow-sm">
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              {BULAN_OPTIONS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <span className="text-gray-300 text-xs">·</span>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="text-sm text-gray-700 bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              {TAHUN_OPTIONS.map((t) => <option key={t} value={String(t)}>{t}</option>)}
            </select>
          </div>

          {/* Comparison toggle */}
          <button
            onClick={() => setComp(!showComparison)}
            className={`h-9 px-3 rounded-xl border text-xs font-medium transition-all ${
              showComparison
                ? "bg-[#0d1f3c] text-white border-[#0d1f3c]"
                : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            vs Bulan Lalu
          </button>

          {/* Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-[#0d1f3c] shadow-sm disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-red-600 text-sm">{error}</div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-1 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-6 bg-gray-100 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-64 animate-pulse" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 h-48 animate-pulse" />
        </div>
      )}

      {/* ── Data ─────────────────────────────────────────────────────────── */}
      {!loading && data && (
        <div className="space-y-5">
          {/* Periode label */}
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#C9A84C] rounded-full" />
            <p className="text-sm font-semibold text-[#0d1f3c]">{labelPeriode}</p>
          </div>

          {/* KPI */}
          <KpiCards data={data} showComparison={showComparison} />

          {/* Charts */}
          <Charts data={data} />

          {/* Export */}
          <ExportButtons data={data} periode={periode} />

          {/* Tab Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Tab Nav */}
            <div className="border-b border-gray-100 px-1 flex overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors relative ${
                    tab === t.id ? "text-[#0d1f3c]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t.label}
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0d1f3c] rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-5">
              {tab === "ringkasan" && (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Per Kategori Sesi</p>
                    {data.pemasukan.perKategori.length === 0 ? (
                      <p className="text-sm text-gray-300 text-center py-6">Tidak ada booking</p>
                    ) : (
                      <div className="overflow-x-auto -mx-1">
                        <div className="space-y-2 min-w-[320px] px-1">
                          {data.pemasukan.perKategori.map((k) => {
                            const pct = data.pemasukan.total > 0 ? (k.total / data.pemasukan.total) * 100 : 0
                            const label: Record<string, string> = { wisuda: "Wisuda", prewed: "Prewedding", keluarga: "Keluarga", group: "Group", portrait: "Portrait" }
                            return (
                              <div key={k.kategori} className="flex items-center gap-3">
                                <span className="text-sm text-gray-600 w-24 shrink-0">{label[k.kategori] ?? k.kategori}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                  <div className="h-full bg-[#0d1f3c] rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 text-right shrink-0">
                                  {new Intl.NumberFormat("id-ID").format(k.total)}
                                </span>
                                <span className="text-xs text-gray-400 w-8 text-right shrink-0">{pct.toFixed(0)}%</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {data.addonInsight.totalBooking > 0 && data.addonInsight.totalRevenueLapangan > 0 && (
                    <>
                      <div className="border-t border-gray-100" />
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Add-on Lapangan</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { label: "Revenue", value: new Intl.NumberFormat("id-ID").format(data.addonInsight.totalRevenueLapangan) },
                            { label: "% Pemasukan", value: `${(data.addonInsight.pctDariPemasukan * 100).toFixed(1)}%` },
                            { label: "Avg / Client", value: new Intl.NumberFormat("id-ID").format(data.addonInsight.avgPerBookingAdaAddon) },
                            { label: "Top Item", value: data.addonInsight.topItem ?? "—" },
                          ].map((m) => (
                            <div key={m.label} className="bg-amber-50 rounded-xl px-4 py-3">
                              <p className="text-xs text-amber-500 font-medium mb-1">{m.label}</p>
                              <p className="text-sm font-bold text-amber-800 truncate">{m.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === "pemasukan" && (
                <TabelPemasukan
                  data={data.pemasukan}
                  detailAddonLapangan={data.detailAddonLapangan}
                  addonInsight={data.addonInsight}
                />
              )}

              {tab === "pengeluaran" && (
                <TabelPengeluaran
                  data={data.pengeluaran}
                  periode={periode}
                  onRefresh={fetchData}
                />
              )}

              {tab === "pembayaran" && (
                <TabelPembayaran pembayaran={data.pembayaran} />
              )}

              {tab === "aruskas" && (
                <TabelSaldoBerjalan
                  saldoBerjalan={data.saldoBerjalan}
                  saldoAwal={data.kas?.saldoAwal ?? 0}
                  pembayaran={data.pembayaran}
                />
              )}

              {tab === "bagihasil" && (
                <CardBagiHasil
                  kas={data.kas}
                  periode={periode}
                  onRefresh={fetchData}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {!loading && !data && !error && (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <p className="text-gray-300">Tidak ada data untuk periode ini</p>
        </div>
      )}
    </div>
  )
}
