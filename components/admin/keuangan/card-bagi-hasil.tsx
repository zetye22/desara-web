"use client"

import { useState } from "react"
import { formatRupiah } from "@/lib/utils"
import type { KasStudio } from "./types"
import { Settings2, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { toast } from "sonner"

interface CardBagiHasilProps {
  kas: KasStudio
  periode: string
  onRefresh: () => void
}

export function CardBagiHasil({ kas, periode, onRefresh }: CardBagiHasilProps) {
  const [edit, setEdit]         = useState(false)
  const [saldoInput, setSaldo]  = useState(String(kas.saldoAwal))
  const [pctInput, setPct]      = useState(String(kas.persenInvestor))
  const [saving, setSaving]     = useState(false)

  const { bagiHasil } = kas

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/keuangan/kas-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periode,
          saldo_awal: Number(saldoInput.replace(/\D/g, "")),
          persen_investor: Number(pctInput),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Pengaturan kas disimpan")
      setEdit(false)
      onRefresh()
    } catch {
      toast.error("Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Setting Kas */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">Skema bagi hasil: Investor {kas.persenInvestor}% · Studio {100 - kas.persenInvestor}%</p>
        </div>
        <button
          onClick={() => { setEdit(!edit); setSaldo(String(kas.saldoAwal)); setPct(String(kas.persenInvestor)) }}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#0d1f3c] border border-gray-200 rounded-lg px-3 py-1.5 transition-colors bg-white"
        >
          <Settings2 className="w-3.5 h-3.5" /> Atur Kas & Investor
        </button>
      </div>

      {/* Form Edit */}
      {edit && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Pengaturan Kas Bulan Ini</p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Saldo Awal Bulan (Rp)</label>
              <input
                type="number"
                value={saldoInput}
                onChange={(e) => setSaldo(e.target.value)}
                className="h-9 w-48 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">% Bagian Investor</label>
              <input
                type="number" min="0" max="100"
                value={pctInput}
                onChange={(e) => setPct(e.target.value)}
                className="h-9 w-24 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="h-9 px-4 bg-[#0d1f3c] text-white text-sm rounded-lg font-medium hover:bg-[#162d56] disabled:opacity-50 flex items-center gap-1.5">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Simpan
              </button>
              <button onClick={() => setEdit(false)}
                className="h-9 px-4 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-white bg-white">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ringkasan Laba/Rugi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Laba/Rugi Card */}
        <div className={`rounded-xl p-5 ${bagiHasil.isRugi ? "bg-red-50 border border-red-100" : "bg-emerald-50 border border-emerald-100"}`}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide ${bagiHasil.isRugi ? "text-red-500" : "text-emerald-600"}`}>
                {bagiHasil.isRugi ? "Rugi Bulan Ini" : "Laba Bersih"}
              </p>
              <p className={`text-2xl font-bold mt-1 ${bagiHasil.isRugi ? "text-red-600" : "text-emerald-700"}`}>
                {formatRupiah(Math.abs(bagiHasil.laba))}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bagiHasil.isRugi ? "bg-red-100" : "bg-emerald-100"}`}>
              {bagiHasil.isRugi
                ? <TrendingDown className="w-5 h-5 text-red-500" />
                : <TrendingUp className="w-5 h-5 text-emerald-600" />
              }
            </div>
          </div>
          {bagiHasil.isRugi ? (
            <p className="text-xs text-red-500">Investor tidak mendapat bagian. Kerugian ditanggung kas studio.</p>
          ) : (
            <p className="text-xs text-emerald-600">Dibagi {kas.persenInvestor}% investor · {100 - kas.persenInvestor}% studio</p>
          )}
        </div>

        {/* Distribusi Bagi Hasil */}
        <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribusi</p>
          <div className="flex items-center justify-between py-2.5 px-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-blue-700">Investor ({kas.persenInvestor}%)</p>
              <p className="text-xs text-blue-400 mt-0.5">{bagiHasil.isRugi ? "Tidak ada bagian" : "Ditransfer ke investor"}</p>
            </div>
            <p className="text-base font-bold text-blue-700">{formatRupiah(bagiHasil.bagianInvestor)}</p>
          </div>
          <div className="flex items-center justify-between py-2.5 px-3 bg-emerald-50 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-emerald-700">Studio ({100 - kas.persenInvestor}%)</p>
              <p className="text-xs text-emerald-400 mt-0.5">Masuk kas studio</p>
            </div>
            <p className="text-base font-bold text-emerald-700">{formatRupiah(bagiHasil.bagianStudio)}</p>
          </div>
        </div>
      </div>

      {/* Saldo Akhir Kas Studio */}
      <div className="rounded-xl bg-[#0d1f3c] px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/50 font-medium">Saldo Kas Studio — Setelah Bagi Hasil</p>
            <p className="text-xs text-white/30 mt-1">
              {formatRupiah(kas.saldoAwal)} awal + {formatRupiah(kas.totalMasuk)} masuk − {formatRupiah(kas.totalKeluar)} keluar − {formatRupiah(bagiHasil.bagianInvestor)} investor
            </p>
          </div>
          <p className={`text-2xl font-bold ${kas.saldoSetelahBagiHasil < 0 ? "text-red-300" : "text-[#C9A84C]"}`}>
            {formatRupiah(kas.saldoSetelahBagiHasil)}
          </p>
        </div>
      </div>
    </div>
  )
}
