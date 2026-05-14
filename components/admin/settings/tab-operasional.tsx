"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { SettingsRow, OperasionalValue } from "./types"

interface TabOperasionalProps {
  item: SettingsRow | undefined
  isOwner: boolean
  onRefresh: () => void
}

const DEFAULT: OperasionalValue = {
  jam_buka: "10:00",
  jam_tutup: "21:00",
  dp_minimum: 100000,
  toleransi_terlambat: 15,
  waktu_editing_reguler_jam: 12,
  waktu_editing_prewed_jam: 24,
}

export function TabOperasional({ item, isOwner, onRefresh }: TabOperasionalProps) {
  const [form, setForm] = useState<OperasionalValue>(DEFAULT)
  const [dpInput, setDpInput] = useState("100000")
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (item) {
      const v: OperasionalValue = { ...DEFAULT, ...item.value }
      setForm(v)
      setDpInput(String(v.dp_minimum))
      setDirty(false)
    }
  }, [item])

  function update<K extends keyof OperasionalValue>(key: K, val: OperasionalValue[K]) {
    setForm((prev) => ({ ...prev, [key]: val }))
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!dirty) { toast.info("Tidak ada perubahan"); return }

    const dp = parseInt(dpInput.replace(/\D/g, "") || "0")
    if (dp < 0) { toast.error("DP minimum tidak boleh negatif"); return }

    const newForm = { ...form, dp_minimum: dp }

    setSaving(true)
    try {
      const res = await fetch("/api/settings/operasional", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newForm }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Pengaturan operasional berhasil disimpan")
      setDirty(false)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl">
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700 mb-4">
          Hanya Owner yang bisa mengubah pengaturan operasional.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Jam Operasional */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-[#0d1f3c] mb-4">Jam Operasional</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Jam Buka</label>
              <input type="time" value={form.jam_buka}
                onChange={(e) => update("jam_buka", e.target.value)}
                disabled={!isOwner}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Jam Tutup</label>
              <input type="time" value={form.jam_tutup}
                onChange={(e) => update("jam_tutup", e.target.value)}
                disabled={!isOwner}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
            </div>
          </div>
        </div>

        {/* Booking */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-[#0d1f3c] mb-4">Pengaturan Booking</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">DP Minimum</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">Rp</span>
                <input type="text"
                  value={Number(dpInput.replace(/\D/g,"")).toLocaleString("id-ID") || ""}
                  onChange={(e) => { setDpInput(e.target.value.replace(/\D/g,"")); setDirty(true) }}
                  disabled={!isOwner}
                  className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              {dpInput && (
                <p className="text-xs text-gray-400 mt-1">{formatRupiah(parseInt(dpInput.replace(/\D/g,"") || "0"))}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Toleransi Keterlambatan</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.toleransi_terlambat} min={0} max={60}
                  onChange={(e) => update("toleransi_terlambat", parseInt(e.target.value || "0"))}
                  disabled={!isOwner}
                  className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
                <span className="text-sm text-gray-500">menit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Editing */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-[#0d1f3c] mb-4">Waktu Editing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Reguler</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.waktu_editing_reguler_jam} min={1}
                  onChange={(e) => update("waktu_editing_reguler_jam", parseInt(e.target.value || "1"))}
                  disabled={!isOwner}
                  className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
                <span className="text-sm text-gray-500">jam</span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Prewedding</label>
              <div className="flex items-center gap-2">
                <input type="number" value={form.waktu_editing_prewed_jam} min={1}
                  onChange={(e) => update("waktu_editing_prewed_jam", parseInt(e.target.value || "1"))}
                  disabled={!isOwner}
                  className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 disabled:text-gray-400" />
                <span className="text-sm text-gray-500">jam</span>
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <Button
            type="submit"
            className="w-full bg-[#0d1f3c] hover:bg-[#1a3561] gap-2"
            disabled={saving || !dirty}
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan Pengaturan Operasional"}
          </Button>
        )}
      </form>
    </div>
  )
}
