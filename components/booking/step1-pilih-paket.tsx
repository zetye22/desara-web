"use client"

import { Check, Clock, ImageIcon, Users, Printer, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useBookingStore } from "@/lib/booking-store"
import { INCLUDED_ALL_PAKET, KATEGORI_LABEL, SEMUA_PAKET, ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"
import type { KategoriSesi } from "@/types"
import type { PaketKatalog } from "@/lib/katalog-types"

// 'couple' & 'custom' tidak ditampilkan di sini — hanya bisa dibuat oleh admin
const KATEGORI_LIST: { value: KategoriSesi; icon: string; deskripsi: string }[] = [
  { value: "wisuda",   icon: "🎓", deskripsi: "Abadikan hari kelulusan" },
  { value: "prewed",   icon: "💍", deskripsi: "Momen sebelum pernikahan" },
  { value: "keluarga", icon: "👨‍👩‍👧", deskripsi: "Foto bersama keluarga" },
  { value: "group",    icon: "👥", deskripsi: "Sahabat, komunitas, tim" },
  { value: "portrait", icon: "🖼️", deskripsi: "Headshot & foto solo" },
]

// ─── 1a: Pilih Kategori ────────────────────────────────────────
function PilihKategori() {
  const { kategori, setKategori } = useBookingStore()

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Pilih Kategori Sesi</h2>
      <p className="text-sm text-gray-500 mb-6">Pilih sesuai kebutuhan foto Anda</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {KATEGORI_LIST.map((k) => {
          const isActive = kategori === k.value
          return (
            <button
              key={k.value}
              onClick={() => setKategori(k.value)}
              aria-pressed={isActive}
              className={`text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-1
                ${isActive
                  ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{k.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold ${isActive ? "text-[#0d1f3c]" : "text-gray-700"}`}>
                      {KATEGORI_LABEL[k.value]}
                    </p>
                    {isActive && <Check className="w-4 h-4 text-[#C9A84C] shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{k.deskripsi}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── 1b: Pilih Paket ──────────────────────────────────────────
function PilihPaket() {
  const { kategori, paketId, setPaketId, katalog } = useBookingStore()

  // Gunakan data dari DB (katalog), fallback ke constants
  const semuaPaket: PaketKatalog[] = katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama,
    kategori: p.kategori, harga: p.harga, hargaMulaiDari: p.hargaMulaiDari,
    durasiMenit: p.durasiMenit, jumlahBackground: p.jumlahBackground,
    maxOrang: p.maxOrang, cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))

  const paketList = semuaPaket.filter((p) => p.kategori === kategori)

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#0d1f3c] mb-1">
        Pilih Paket {KATEGORI_LABEL[kategori!]}
      </h3>
      <p className="text-sm text-gray-500 mb-5">
        Semua paket sudah include: {INCLUDED_ALL_PAKET.join(" + ")}
      </p>

      <div className={`grid gap-4 ${paketList.length === 1 ? "max-w-md" : "sm:grid-cols-3"}`}>
        {paketList.map((paket) => {
          const isActive = paketId === paket.id
          return (
            <button
              key={paket.id}
              onClick={() => setPaketId(paket.id)}
              aria-pressed={isActive}
              className={`text-left rounded-xl border-2 overflow-hidden transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-1
                ${isActive
                  ? "border-[#C9A84C] shadow-md"
                  : "border-gray-200 hover:border-gray-300"
                }`}
            >
              <div className={`px-4 py-3 ${isActive ? "bg-[#0d1f3c]" : "bg-gray-50"}`}>
                {paket.popular && (
                  <span className="inline-block bg-[#C9A84C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5">
                    ⭐ POPULER
                  </span>
                )}
                <p className={`text-lg font-bold ${isActive ? "text-white" : "text-[#0d1f3c]"}`}>
                  {paket.nama}
                </p>
                <div className="mt-1">
                  {paket.hargaMulaiDari && (
                    <span className={`text-[11px] block ${isActive ? "text-blue-200/60" : "text-gray-400"}`}>
                      Mulai dari
                    </span>
                  )}
                  <span className="text-xl font-bold text-[#C9A84C]">
                    {formatRupiah(paket.harga)}
                  </span>
                </div>
              </div>

              <div className="px-4 py-3 bg-white">
                <ul className="space-y-1.5">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                    {paket.durasiMenit} menit
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <ImageIcon className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                    {paket.jumlahBackground} background
                  </li>
                  {paket.maxOrang && (
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                      Maks. {paket.maxOrang} orang
                    </li>
                  )}
                  {paket.cetakInclude && (
                    <li className="flex items-center gap-2 text-sm text-gray-600">
                      <Printer className="w-3.5 h-3.5 text-[#C9A84C] shrink-0" />
                      Cetak {paket.cetakInclude} + Frame
                    </li>
                  )}
                </ul>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1.5 text-[#C9A84C] text-xs font-semibold">
                    <Check className="w-3.5 h-3.5" /> Dipilih
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Add-on picker ────────────────────────────────────────────
function AddOnPicker() {
  const { paketId, addons, setAddon, jumlahOrang, katalog } = useBookingStore()

  const semuaPaket: PaketKatalog[] = katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))
  const paket = semuaPaket.find((p) => p.id === paketId)
  if (!paket) return null

  const addonData = katalog?.addon ?? {
    tambahanWaktu:      ADD_ONS.tambahanWaktu,
    tambahanOrang:      ADD_ONS.tambahanOrang,
    tambahanBackground: ADD_ONS.tambahanBackground,
    cetak12R:           ADD_ONS.cetak12R,
    cetak20R:           ADD_ONS.cetak20R,
  }

  const orangMelebihi = paket.maxOrang && jumlahOrang > paket.maxOrang
  const selisihOrang  = paket.maxOrang ? Math.max(0, jumlahOrang - paket.maxOrang) : 0

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-[#0d1f3c] mb-1">Add-On (Opsional)</h3>
      <p className="text-sm text-gray-500 mb-5">Sesuaikan dengan kebutuhan tambahan Anda</p>

      <div className="space-y-3 max-w-lg">
        {/* Tambahan Waktu */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">{addonData.tambahanWaktu.nama}</p>
            <p className="text-xs text-gray-400">
              {formatRupiah(addonData.tambahanWaktu.harga)} / {addonData.tambahanWaktu.satuan}
            </p>
          </div>
          <Counter value={addons.tambahanWaktu} min={0} max={6} onChange={(v) => setAddon("tambahanWaktu", v)} />
        </div>

        {/* Tambahan Orang */}
        {paket.maxOrang && (
          <div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
              <div>
                <p className="text-sm font-medium text-gray-700">{addonData.tambahanOrang.nama}</p>
                <p className="text-xs text-gray-400">
                  {formatRupiah(addonData.tambahanOrang.harga)} / {addonData.tambahanOrang.satuan}
                </p>
              </div>
              <Counter value={addons.tambahanOrang} min={0} max={20} onChange={(v) => setAddon("tambahanOrang", v)} />
            </div>
            {orangMelebihi && (
              <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Paket {paket.nama} maks. {paket.maxOrang} orang.
                  Tambah {selisihOrang} orang (+{formatRupiah(addonData.tambahanOrang.harga * selisihOrang)}).
                </span>
              </div>
            )}
          </div>
        )}

        {/* Tambahan Background */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">{addonData.tambahanBackground.nama}</p>
            <p className="text-xs text-gray-400">
              {formatRupiah(addonData.tambahanBackground.harga)} / {addonData.tambahanBackground.satuan}
            </p>
          </div>
          <Counter value={addons.tambahanBackground} min={0} max={4} onChange={(v) => setAddon("tambahanBackground", v)} />
        </div>

        {/* Cetak */}
        {paket.cetakInclude && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check className="w-4 h-4 shrink-0" />
            Paket ini sudah include Cetak {paket.cetakInclude} + Frame
          </div>
        )}
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">{addonData.cetak12R.nama}</p>
            <p className="text-xs text-gray-400">{formatRupiah(addonData.cetak12R.harga)} / lembar</p>
          </div>
          <Counter value={addons.cetak12R} min={0} max={10} onChange={(v) => setAddon("cetak12R", v)} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white">
          <div>
            <p className="text-sm font-medium text-gray-700">{addonData.cetak20R.nama}</p>
            <p className="text-xs text-gray-400">{formatRupiah(addonData.cetak20R.harga)} / lembar</p>
          </div>
          <Counter value={addons.cetak20R} min={0} max={10} onChange={(v) => setAddon("cetak20R", v)} />
        </div>
      </div>
    </div>
  )
}

function Counter({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
        aria-label="Kurangi">−</button>
      <span className="w-5 text-center text-sm font-semibold text-gray-800">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
        aria-label="Tambah">+</button>
    </div>
  )
}

// ─── Komponen utama Step 1 ─────────────────────────────────────
export function Step1PilihPaket() {
  const { kategori, paketId, nextStep } = useBookingStore()
  const bisaLanjut = !!kategori && !!paketId

  return (
    <div>
      <PilihKategori />
      {kategori && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <PilihPaket />
        </div>
      )}
      {paketId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <AddOnPicker />
        </div>
      )}
      <div className="mt-8 flex justify-end">
        <Button
          onClick={nextStep}
          disabled={!bisaLanjut}
          className="bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white rounded-full px-8 h-11 font-semibold disabled:opacity-40"
        >
          Lanjut ke Pilih Jadwal
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
