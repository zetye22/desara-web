"use client"

import { useState, useEffect, useCallback } from "react"
import { Receipt, Repeat, History } from "lucide-react"
import { TabTetap } from "./tab-tetap"
import { TabBulan } from "./tab-bulan"
import { TabRiwayat } from "./tab-riwayat"
import type { KategoriPengeluaran, Pengeluaran, PengeluaranTetap } from "./types"

const TABS = [
  { id: "tetap",   label: "Pengeluaran Tetap", icon: Repeat },
  { id: "bulan",   label: "Bulan Ini",         icon: Receipt },
  { id: "riwayat", label: "Riwayat",           icon: History },
] as const

type TabId = typeof TABS[number]["id"]

interface RiwayatBulan {
  bulan: string
  bulanLabel: string
  total: number
  byKategori: Array<{ nama: string; warna: string; total: number }>
}

export function PengeluaranClient() {
  const [activeTab, setActiveTab] = useState<TabId>("tetap")

  // Data kategori (dimuat sekali)
  const [kategoriList, setKategoriList] = useState<KategoriPengeluaran[]>([])

  // Data tab tetap
  const [posTetap, setPosTetap] = useState<PengeluaranTetap[]>([])

  // Data tab bulan
  const bulanSekarang = new Date().toISOString().slice(0, 7)
  const [bulanAktif, setBulanAktif] = useState(bulanSekarang)
  const [pengeluaranBulan, setPengeluaranBulan] = useState<Pengeluaran[]>([])
  const [loadingBulan, setLoadingBulan] = useState(false)

  // Data tab riwayat
  const [riwayat, setRiwayat] = useState<RiwayatBulan[]>([])
  const [loadingRiwayat, setLoadingRiwayat] = useState(false)

  // IDs pos tetap yang sudah di-generate untuk bulanAktif
  const [sudahDigenerate, setSudahDigenerate] = useState<Set<string>>(new Set())

  // ── Load kategori ──────────────────────────────────────────
  const loadKategori = useCallback(async () => {
    try {
      const res = await fetch("/api/pengeluaran/kategori")
      const data = await res.json()
      if (res.ok) setKategoriList(data.items ?? [])
    } catch { /* silent */ }
  }, [])

  // ── Load pos tetap ─────────────────────────────────────────
  const loadPosTetap = useCallback(async () => {
    try {
      const res = await fetch("/api/pengeluaran/tetap")
      const data = await res.json()
      if (res.ok) setPosTetap(data.items ?? [])
    } catch { /* silent */ }
  }, [])

  // ── Load pengeluaran bulan tertentu ────────────────────────
  const loadBulan = useCallback(async (bulan: string) => {
    setLoadingBulan(true)
    try {
      const res = await fetch(`/api/pengeluaran?bulan=${bulan}`)
      const data = await res.json()
      if (res.ok) {
        const items: Pengeluaran[] = data.items ?? []
        setPengeluaranBulan(items)

        // Cek mana saja recurring_id yang sudah ada
        const generatedIds = new Set<string>(
          items.filter((i) => i.is_recurring && i.recurring_id).map((i) => i.recurring_id!)
        )
        setSudahDigenerate(generatedIds)
      }
    } catch { /* silent */ } finally {
      setLoadingBulan(false)
    }
  }, [])

  // ── Load riwayat 12 bulan ──────────────────────────────────
  const loadRiwayat = useCallback(async () => {
    setLoadingRiwayat(true)
    try {
      const bulanList: string[] = []
      const now = new Date()
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        bulanList.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
      }

      const results = await Promise.all(
        bulanList.map(async (bulan) => {
          const res = await fetch(`/api/pengeluaran?bulan=${bulan}`)
          const data = await res.json()
          const items: Pengeluaran[] = res.ok ? (data.items ?? []) : []

          // Agregasi per kategori
          const byKatMap = new Map<string, { nama: string; warna: string; total: number }>()
          for (const item of items) {
            const key = item.kategori_id ?? "uncategorized"
            const existing = byKatMap.get(key)
            if (existing) {
              existing.total += item.nominal
            } else {
              byKatMap.set(key, {
                nama: item.kategori_pengeluaran?.nama ?? "Lainnya",
                warna: item.kategori_pengeluaran?.warna ?? "#6B7280",
                total: item.nominal,
              })
            }
          }

          const [y, m] = bulan.split("-").map(Number)
          const bulanLabel = new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
            month: "short", year: "numeric",
          })

          return {
            bulan,
            bulanLabel,
            total: items.reduce((s, i) => s + i.nominal, 0),
            byKategori: Array.from(byKatMap.values()).sort((a, b) => b.total - a.total),
          }
        })
      )

      setRiwayat(results)
    } catch { /* silent */ } finally {
      setLoadingRiwayat(false)
    }
  }, [])

  // ── Initial load ───────────────────────────────────────────
  useEffect(() => {
    loadKategori()
    loadPosTetap()
    loadBulan(bulanAktif)
  }, [loadKategori, loadPosTetap, loadBulan, bulanAktif])

  // Load riwayat hanya saat tab aktif
  useEffect(() => {
    if (activeTab === "riwayat" && riwayat.length === 0) {
      loadRiwayat()
    }
  }, [activeTab, riwayat.length, loadRiwayat])

  // ── Refresh bulan + tetap saat bulan berubah ───────────────
  function handleBulanChange(bulan: string) {
    setBulanAktif(bulan)
    loadBulan(bulan)
  }

  function handleRefreshTetap() {
    loadPosTetap()
    loadBulan(bulanAktif) // refresh sudahDigenerate juga
  }

  function handleRefreshBulan() {
    loadBulan(bulanAktif)
  }

  return (
    <div className="space-y-5">
      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-full sm:w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              setActiveTab(id)
              if (id === "riwayat" && riwayat.length === 0) loadRiwayat()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white text-[#0d1f3c] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "tetap" && (
        <TabTetap
          items={posTetap}
          kategoriList={kategoriList}
          bulanAktif={bulanAktif}
          sudahDigenerate={sudahDigenerate}
          onRefresh={handleRefreshTetap}
        />
      )}

      {activeTab === "bulan" && (
        <TabBulan
          items={pengeluaranBulan}
          kategoriList={kategoriList}
          bulan={bulanAktif}
          loading={loadingBulan}
          onBulanChange={handleBulanChange}
          onRefresh={handleRefreshBulan}
        />
      )}

      {activeTab === "riwayat" && (
        <TabRiwayat
          data={riwayat}
          loading={loadingRiwayat}
        />
      )}
    </div>
  )
}
