"use client"

import { useState, useEffect } from "react"
import { RefreshCw } from "lucide-react"
import type { SettingsLog } from "./types"

const KEY_LABEL: Record<string, string> = {
  paket_wisuda_bronze: "Paket Bronze",
  paket_wisuda_silver: "Paket Silver",
  paket_wisuda_gold:   "Paket Gold",
  paket_prewed:        "Paket Prewed",
  paket_keluarga:      "Paket Keluarga",
  paket_group:         "Paket Group",
  paket_portrait:      "Paket Portrait",
  addon_tambahan_waktu: "Add-on Waktu",
  addon_tambahan_orang: "Add-on Orang",
  addon_tambahan_bg:    "Add-on Background",
  addon_cetak_12r:      "Add-on Cetak 12R",
  addon_cetak_20r:      "Add-on Cetak 20R",
  operasional:          "Operasional",
  rekening:             "Rekening",
  kontak:               "Kontak",
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "—"
  if (typeof val === "object") {
    // Tampilkan field penting saja
    const v = val as Record<string, unknown>
    if (v.harga !== undefined) return `Harga: Rp ${Number(v.harga).toLocaleString("id-ID")}`
    if (v.nominal !== undefined) return `Upah: Rp ${Number(v.nominal).toLocaleString("id-ID")}`
    if (v.jam_buka !== undefined) return `${v.jam_buka}–${v.jam_tutup}`
    if (v.bank !== undefined) return `${v.bank} - ${v.nomor}`
    if (v.nama !== undefined) return String(v.nama)
    return JSON.stringify(val).slice(0, 60)
  }
  return String(val)
}

export function TabRiwayat() {
  const [logs, setLogs] = useState<SettingsLog[]>([])
  const [loading, setLoading] = useState(false)
  const [filterKey, setFilterKey] = useState("")

  async function loadLogs() {
    setLoading(true)
    try {
      const url = filterKey ? `/api/settings/log?key=${filterKey}&limit=100` : "/api/settings/log?limit=100"
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) setLogs(data.items ?? [])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey])

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
        >
          <option value="">Semua setting</option>
          {Object.entries(KEY_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-300" />
            Memuat riwayat...
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">
            Belum ada riwayat perubahan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-2.5 text-left font-medium">Setting</th>
                  <th className="px-5 py-2.5 text-left font-medium">Diubah dari</th>
                  <th className="px-5 py-2.5 text-left font-medium">Menjadi</th>
                  <th className="px-5 py-2.5 text-left font-medium">Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap text-xs">
                      {new Date(log.diubah_pada).toLocaleString("id-ID", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-[#0d1f3c]">
                        {KEY_LABEL[log.setting_key] ?? log.setting_key}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-500 text-xs max-w-[160px] truncate">
                      {log.value_lama ? formatValue(log.value_lama) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-2.5 text-green-700 font-medium text-xs max-w-[160px] truncate">
                      {formatValue(log.value_baru)}
                    </td>
                    <td className="px-5 py-2.5 text-gray-500 text-xs">
                      {log.admin_profiles?.nama ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
