"use client"

import { Check, Clock, ImageIcon, Users, Printer, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWaitingListStore } from "@/lib/waiting-list-store"
import { INCLUDED_ALL_PAKET, KATEGORI_LABEL, SEMUA_PAKET, ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"
import type { KategoriSesi } from "@/types"
import type { PaketKatalog } from "@/lib/katalog-types"

const KATEGORI_LIST: { value: KategoriSesi; icon: string; deskripsi: string }[] = [
  { value: "wisuda",   icon: "🎓", deskripsi: "Abadikan hari kelulusan" },
  { value: "prewed",   icon: "💍", deskripsi: "Momen sebelum pernikahan" },
  { value: "keluarga", icon: "👨‍👩‍👧", deskripsi: "Foto bersama keluarga" },
  { value: "group",    icon: "👥", deskripsi: "Sahabat, komunitas, tim" },
  { value: "portrait", icon: "🖼️", deskripsi: "Headshot & foto solo" },
]

function PilihKategori() {
  const { kategori, setKategori } = useWaitingListStore()

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Pilih Kategori Sesi</h2>
      <p className="text-sm text-gray-500 mb-6">Pilih sesuai kebutuhan sesi foto Anda</p>

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

function PilihPaket() {
  const { kategori, paketId, setPaketId, katalog } = useWaitingListStore()

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
                <div className="flex items-center justify-between">
                  <span className={`font-bold text-base ${isActive ? "text-[#C9A84C]" : "text-[#0d1f3c]"}`}>
                    {paket.nama}
                  </span>
                  {paket.popular && (
                    <span className="text-[10px] bg-[#C9A84C] text-white px-2 py-0.5 rounded-full font-medium">
                      Favorit
                    </span>
                  )}
                  {isActive && !paket.popular && (
                    <Check className="w-4 h-4 text-[#C9A84C]" />
                  )}
                </div>
                <div className="mt-1">
                  <span className={`text-lg font-extrabold ${isActive ? "text-white" : "text-gray-900"}`}>
                    {formatRupiah(paket.harga)}
                  </span>
                  {paket.hargaMulaiDari && (
                    <span className={`text-xs ml-1 ${isActive ? "text-blue-200" : "text-gray-500"}`}>
                      (mulai dari)
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>Durasi {paket.durasiMenit} menit</span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{paket.jumlahBackground} background</span>
                </div>
                {paket.maxOrang && (
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>Maks. {paket.maxOrang} orang</span>
                  </div>
                )}
                {paket.cetakInclude && (
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <Printer className="w-3.5 h-3.5 shrink-0" />
                    <span>Include cetak {paket.cetakInclude} + frame</span>
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

function PilihAddons() {
  const { addons, setAddon, katalog } = useWaitingListStore()

  const hWaktu = katalog?.addon.tambahanWaktu.harga ?? ADD_ONS.tambahanWaktu.harga
  const hOrang = katalog?.addon.tambahanOrang.harga ?? ADD_ONS.tambahanOrang.harga
  const h12R   = katalog?.addon.cetak12R.harga ?? ADD_ONS.cetak12R.harga
  const h20R   = katalog?.addon.cetak20R.harga ?? ADD_ONS.cetak20R.harga

  const addonList = [
    { key: "tambahanWaktu" as const, nama: "Tambahan Waktu", deskripsi: "per 10 menit", harga: hWaktu, value: addons.tambahanWaktu, max: 6 },
    { key: "tambahanOrang" as const, nama: "Tambahan Orang", deskripsi: "per orang melebihi kapasitas paket", harga: hOrang, value: addons.tambahanOrang, max: 20 },
    { key: "cetak12R" as const, nama: "Cetak 12R + Frame", deskripsi: "Ukuran 30x40 cm", harga: h12R, value: addons.cetak12R, max: 5 },
    { key: "cetak20R" as const, nama: "Cetak 20R + Frame", deskripsi: "Ukuran 50x60 cm", harga: h20R, value: addons.cetak20R, max: 3 },
  ]

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-base font-bold text-[#0d1f3c] mb-1">Add-on Tambahan (Opsional)</h3>
      <p className="text-sm text-gray-500 mb-4">Tambahkan layanan ekstra sesuai kebutuhan Anda</p>

      <div className="space-y-3">
        {addonList.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div>
              <p className="text-sm font-semibold text-gray-800">{item.nama}</p>
              <p className="text-xs text-gray-400">
                {formatRupiah(item.harga)} {item.deskripsi}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAddon(item.key, Math.max(0, item.value - 1))}
                disabled={item.value === 0}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                -
              </button>
              <span className="w-6 text-center text-sm font-semibold text-gray-800">
                {item.value}
              </span>
              <button
                type="button"
                onClick={() => setAddon(item.key, Math.min(item.max, item.value + 1))}
                disabled={item.value >= item.max}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Step1PilihPaketWaitingList() {
  const { kategori, paketId, nextStep } = useWaitingListStore()
  const canProceed = !!kategori && !!paketId

  return (
    <div>
      <PilihKategori />
      {kategori && <PilihPaket />}
      {paketId && <PilihAddons />}

      <div className="mt-8 flex justify-end">
        <Button
          onClick={nextStep}
          disabled={!canProceed}
          className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-8 h-11 font-semibold disabled:opacity-40"
        >
          Lanjut ke Data Client & Background
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
