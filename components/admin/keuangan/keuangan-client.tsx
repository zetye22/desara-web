"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { LaporanData } from "./types"
import { KpiCards } from "./kpi-cards"
import { Charts } from "./charts"
import { TabelPemasukan } from "./tabel-pemasukan"
import { TabelPengeluaran } from "./tabel-pengeluaran"
import { ExportButtons } from "./export-buttons"
import { AddonInsightCard } from "./addon-insight-card"

// Tahun yang tersedia di selector
const TAHUN_OPTIONS = [2024, 2025, 2026]

// Nama bulan Indonesia
const BULAN_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

// Skeleton loader satu card
function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm animate-pulse">
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="w-9 h-9 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-7 bg-gray-200 rounded w-40" />
    </div>
  )
}

// Skeleton loader tabel
function TabelSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="h-5 bg-gray-200 rounded w-48" />
      </div>
      <div className="p-5 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded flex-1" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  )
}

interface KeuanganClientProps {
  initialPeriode: string
}

export function KeuanganClient({ initialPeriode }: KeuanganClientProps) {
  // Pisah tahun dan bulan dari initialPeriode
  const [tahun, setTahun] = useState(initialPeriode.split("-")[0])
  const [bulan, setBulan] = useState(initialPeriode.split("-")[1])
  const [showComparison, setShowComparison] = useState(false)
  const [data, setData] = useState<LaporanData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const periode = `${tahun}-${bulan}`

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const url = `/api/keuangan/laporan?periode=${periode}&compare=${showComparison}`
      const res = await fetch(url)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? "Gagal memuat laporan")
        toast.error(json.error ?? "Gagal memuat laporan")
        return
      }

      setData(json)
    } catch {
      setError("Gagal terhubung ke server")
      toast.error("Gagal terhubung ke server")
    } finally {
      setLoading(false)
    }
  }, [periode, showComparison])

  // Fetch ulang saat periode atau toggle comparison berubah
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Format label periode untuk heading
  const labelPeriode = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${periode}-01`))

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ringkasan pemasukan, pengeluaran, dan laba bersih studio
        </p>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Pilih Bulan */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium whitespace-nowrap">Bulan:</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/30"
            >
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Tahun */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium">Tahun:</label>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/30"
            >
              {TAHUN_OPTIONS.map((t) => (
                <option key={t} value={String(t)}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Comparison */}
          <label className="flex items-center gap-2 cursor-pointer select-none ml-2">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showComparison}
                onChange={(e) => setShowComparison(e.target.checked)}
              />
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  showComparison ? "bg-[#0d1f3c]" : "bg-gray-300"
                }`}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  showComparison ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
            <span className="text-sm text-gray-600">Bandingkan dengan Bulan Lalu</span>
          </label>

          {/* Tombol Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0d1f3c] transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Error State ─────────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* ── Loading Skeleton ────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-6">
          {/* 4 KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
          {/* Chart placeholder */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse h-[280px]" />
          {/* Tabel placeholders */}
          <TabelSkeleton />
          <TabelSkeleton />
        </div>
      )}

      {/* ── Data Tersedia ────────────────────────────────────────────────── */}
      {!loading && data && (
        <div className="space-y-6">
          {/* Judul periode */}
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-[#C9A84C] rounded-full" />
            <h2 className="text-lg font-semibold text-[#0d1f3c]">
              Laporan Bulan {labelPeriode}
            </h2>
          </div>

          {/* KPI Cards */}
          <KpiCards data={data} showComparison={showComparison} />

          {/* Charts */}
          <Charts data={data} />

          {/* Tabel Pemasukan */}
          <TabelPemasukan
            data={data.pemasukan}
            detailAddonLapangan={data.detailAddonLapangan}
          />

          {/* Insight Add-on Lapangan */}
          <AddonInsightCard
            insight={data.addonInsight}
            detailAddonLapangan={data.detailAddonLapangan}
          />

          {/* Tabel Pengeluaran */}
          <TabelPengeluaran
            data={data.pengeluaran}
            periode={periode}
            onRefresh={fetchData}
          />

          {/* Export Buttons */}
          <ExportButtons data={data} periode={periode} />
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {!loading && !data && !error && (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <p className="text-gray-400">Tidak ada data untuk periode ini</p>
        </div>
      )}
    </div>
  )
}
