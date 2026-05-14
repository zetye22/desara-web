"use client"

import { useState, useEffect } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { SettingsRow, RekeningValue, KontakValue } from "./types"

interface TabRekeningProps {
  rekening: SettingsRow | undefined
  kontak: SettingsRow | undefined
  isOwner: boolean
  onRefresh: () => void
}

const DEFAULT_REKENING: RekeningValue = { bank: "", nomor: "", nama_pemilik: "" }
const DEFAULT_KONTAK: KontakValue = { wa: "", email: "", alamat: "", maps_url: "", instagram: "", tiktok: "" }

export function TabRekening({ rekening, kontak, isOwner, onRefresh }: TabRekeningProps) {
  const [formRek, setFormRek] = useState<RekeningValue>(DEFAULT_REKENING)
  const [formKon, setFormKon] = useState<KontakValue>(DEFAULT_KONTAK)
  const [savingRek, setSavingRek] = useState(false)
  const [savingKon, setSavingKon] = useState(false)
  const [dirtyRek, setDirtyRek] = useState(false)
  const [dirtyKon, setDirtyKon] = useState(false)

  useEffect(() => {
    if (rekening) { setFormRek({ ...DEFAULT_REKENING, ...rekening.value }); setDirtyRek(false) }
  }, [rekening])

  useEffect(() => {
    if (kontak) { setFormKon({ ...DEFAULT_KONTAK, ...kontak.value }); setDirtyKon(false) }
  }, [kontak])

  async function saveRekening(e: React.FormEvent) {
    e.preventDefault()
    if (!dirtyRek) { toast.info("Tidak ada perubahan"); return }

    setSavingRek(true)
    try {
      const res = await fetch("/api/settings/rekening", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: formRek }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Info rekening berhasil disimpan")
      setDirtyRek(false)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSavingRek(false)
    }
  }

  async function saveKontak(e: React.FormEvent) {
    e.preventDefault()
    if (!dirtyKon) { toast.info("Tidak ada perubahan"); return }

    setSavingKon(true)
    try {
      const res = await fetch("/api/settings/kontak", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: formKon }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }
      toast.success("Info kontak berhasil disimpan")
      setDirtyKon(false)
      onRefresh()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSavingKon(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {!isOwner && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Hanya Owner yang bisa mengubah info rekening dan kontak.
        </div>
      )}

      {/* Rekening Transfer */}
      <form onSubmit={saveRekening} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#0d1f3c]">Rekening Transfer</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Bank</label>
            <input type="text" value={formRek.bank}
              onChange={(e) => { setFormRek({ ...formRek, bank: e.target.value }); setDirtyRek(true) }}
              disabled={!isOwner}
              placeholder="BCA, BRI, Mandiri..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nomor Rekening</label>
            <input type="text" value={formRek.nomor}
              onChange={(e) => { setFormRek({ ...formRek, nomor: e.target.value }); setDirtyRek(true) }}
              disabled={!isOwner}
              placeholder="1234567890"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama Pemilik</label>
          <input type="text" value={formRek.nama_pemilik}
            onChange={(e) => { setFormRek({ ...formRek, nama_pemilik: e.target.value }); setDirtyRek(true) }}
            disabled={!isOwner}
            placeholder="Sesuai buku tabungan"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
        </div>

        {isOwner && (
          <Button type="submit" size="sm" className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2 w-full" disabled={savingRek || !dirtyRek}>
            <Save className="w-4 h-4" /> {savingRek ? "Menyimpan..." : "Simpan Info Rekening"}
          </Button>
        )}
      </form>

      {/* Kontak Studio */}
      <form onSubmit={saveKontak} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#0d1f3c]">Kontak Studio</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">No WhatsApp</label>
            <input type="text" value={formKon.wa}
              onChange={(e) => { setFormKon({ ...formKon, wa: e.target.value }); setDirtyKon(true) }}
              disabled={!isOwner}
              placeholder="628xxxxxxxxxx"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
            <input type="email" value={formKon.email}
              onChange={(e) => { setFormKon({ ...formKon, email: e.target.value }); setDirtyKon(true) }}
              disabled={!isOwner}
              placeholder="studio@email.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Alamat Lengkap</label>
          <textarea value={formKon.alamat} rows={3}
            onChange={(e) => { setFormKon({ ...formKon, alamat: e.target.value }); setDirtyKon(true) }}
            disabled={!isOwner}
            placeholder="Jl. ..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50 resize-none" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 mb-1.5 block">Link Google Maps</label>
          <input type="url" value={formKon.maps_url}
            onChange={(e) => { setFormKon({ ...formKon, maps_url: e.target.value }); setDirtyKon(true) }}
            disabled={!isOwner}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Instagram</label>
            <input type="text" value={formKon.instagram}
              onChange={(e) => { setFormKon({ ...formKon, instagram: e.target.value }); setDirtyKon(true) }}
              disabled={!isOwner}
              placeholder="@desarastudio"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">TikTok</label>
            <input type="text" value={formKon.tiktok}
              onChange={(e) => { setFormKon({ ...formKon, tiktok: e.target.value }); setDirtyKon(true) }}
              disabled={!isOwner}
              placeholder="@desarastudio"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 disabled:bg-gray-50" />
          </div>
        </div>

        {isOwner && (
          <Button type="submit" size="sm" className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-2 w-full" disabled={savingKon || !dirtyKon}>
            <Save className="w-4 h-4" /> {savingKon ? "Menyimpan..." : "Simpan Info Kontak"}
          </Button>
        )}
      </form>
    </div>
  )
}
