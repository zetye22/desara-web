"use client"

import React from "react"
import { Clock, ImageIcon, Users, Printer, Check, Timer, User, Frame, Layers, Tag } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  SEMUA_PAKET, ADD_ONS, BACKGROUNDS, INCLUDED_ALL_PAKET, KATEGORI_LABEL,
} from "@/lib/constants"
import type { KategoriSesi } from "@/types"
import { formatRupiah } from "@/lib/utils"
import type { KatalogData, PaketKatalog, BgKatalog, AddonItem } from "@/lib/katalog-types"

interface PaketSectionProps {
  katalog?: KatalogData
}

// ─── Gradien untuk background ─────────────────────────────────
const BG_STYLE_MAP: Record<string, string> = {
  utama:   "linear-gradient(135deg, #D4C5A9 0%, #C4AA84 100%)",
  abstrak: "linear-gradient(135deg, #A8C4D4 0%, #7BA7C4 100%)",
  bunga:   "linear-gradient(135deg, #F4A7B9 0%, #F9C6D4 50%, #FFB7C5 100%)",
}

// ─── Card paket ───────────────────────────────────────────────
function PaketCard({ paket, lebar }: { paket: PaketKatalog; lebar?: "normal" | "lega" }) {
  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-white transition-all duration-200
        hover:scale-[1.02] hover:shadow-xl focus-within:ring-2 focus-within:ring-[#C9A84C]
        ${paket.popular ? "border-2 border-[#C9A84C] shadow-lg shadow-[#C9A84C]/10" : "border-gray-200 shadow-sm"}
        ${lebar === "lega" ? "max-w-lg mx-auto w-full" : ""}
      `}
    >
      {paket.popular && (
        <div className="absolute -top-3.5 right-4">
          <Badge className="bg-[#C9A84C] hover:bg-[#C9A84C] text-white px-3 py-1 text-xs font-bold shadow-md">
            ⭐ POPULER
          </Badge>
        </div>
      )}

      <div className={`rounded-t-2xl px-5 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-5 ${paket.popular ? "bg-[#0d1f3c]" : "bg-gray-50"}`}>
        <p className={`text-xs font-semibold tracking-widest uppercase mb-1 ${paket.popular ? "text-[#C9A84C]" : "text-gray-400"}`}>
          {KATEGORI_LABEL[paket.kategori]}
        </p>
        <h3 className={`text-xl sm:text-2xl font-bold mb-2 sm:mb-3 ${paket.popular ? "text-white" : "text-[#0d1f3c]"}`}>
          {paket.nama}
        </h3>
        <div>
          {paket.hargaMulaiDari && (
            <span className={`text-xs block mb-0.5 ${paket.popular ? "text-blue-200/60" : "text-gray-400"}`}>
              Mulai dari
            </span>
          )}
          <span className="text-3xl sm:text-4xl font-bold text-[#C9A84C]">{formatRupiah(paket.harga)}</span>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col flex-1">
        <ul className="space-y-3 mb-5">
          <li className="flex items-center gap-3 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-[#C9A84C] shrink-0" />
            <span>{paket.durasiMenit} menit sesi foto</span>
          </li>
          <li className="flex items-center gap-3 text-sm text-gray-700">
            <ImageIcon className="w-4 h-4 text-[#C9A84C] shrink-0" />
            <span>{paket.jumlahBackground} background pilihan</span>
          </li>
          {paket.maxOrang && (
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Users className="w-4 h-4 text-[#C9A84C] shrink-0" />
              <span>Maks. {paket.maxOrang} orang</span>
            </li>
          )}
          {paket.cetakInclude && (
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <Printer className="w-4 h-4 text-[#C9A84C] shrink-0" />
              <span>Cetak {paket.cetakInclude} + Frame</span>
            </li>
          )}
        </ul>

        <div className="border-t border-dashed border-gray-200 my-4" />

        <ul className="space-y-2 mb-6">
          {INCLUDED_ALL_PAKET.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button
          asChild
          className={`mt-auto w-full rounded-full font-semibold h-11 ${
            paket.popular
              ? "bg-[#C9A84C] hover:bg-[#b8963d] text-white"
              : "bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white"
          }`}
        >
          <a href={`/booking?paket=${paket.id}`}>Pilih Paket {paket.nama}</a>
        </Button>
      </div>
    </article>
  )
}

// ─── Icon per add-on key ──────────────────────────────────────
const ADDON_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  addon_tambahan_waktu: Timer,
  addon_tambahan_orang: User,
  addon_tambahan_bg:    Layers,
  addon_cetak_12r:      Frame,
  addon_cetak_20r:      Frame,
}

// ─── Section Add-On ───────────────────────────────────────────
const DEFAULT_ADDONS: AddonItem[] = [
  { key: "addon_tambahan_waktu", nama: ADD_ONS.tambahanWaktu.nama,      harga: ADD_ONS.tambahanWaktu.harga,      satuan: ADD_ONS.tambahanWaktu.satuan },
  { key: "addon_tambahan_orang", nama: ADD_ONS.tambahanOrang.nama,      harga: ADD_ONS.tambahanOrang.harga,      satuan: ADD_ONS.tambahanOrang.satuan },
  { key: "addon_tambahan_bg",    nama: ADD_ONS.tambahanBackground.nama, harga: ADD_ONS.tambahanBackground.harga, satuan: ADD_ONS.tambahanBackground.satuan },
  { key: "addon_cetak_12r",      nama: ADD_ONS.cetak12R.nama,           harga: ADD_ONS.cetak12R.harga },
  { key: "addon_cetak_20r",      nama: ADD_ONS.cetak20R.nama,           harga: ADD_ONS.cetak20R.harga },
]

function AddOnSection({ katalog }: { katalog?: KatalogData }) {
  const items = katalog?.allAddons ?? DEFAULT_ADDONS
  const cols = items.length <= 3 ? "sm:grid-cols-3" : items.length === 4 ? "sm:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-5"

  return (
    <div className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-base font-bold text-[#0d1f3c] whitespace-nowrap">Add-On Tambahan</h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className={`flex gap-3 overflow-x-auto pb-2 sm:grid ${cols} sm:overflow-visible`}>
        {items.map((item) => {
          const Icon = ADDON_ICON_MAP[item.key] ?? Tag
          return (
            <div key={item.key}
              className="shrink-0 sm:shrink flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-4 text-center hover:border-[#C9A84C]/50 hover:shadow-sm transition-all min-w-[140px] sm:min-w-0"
            >
              <div className="w-9 h-9 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#C9A84C]" />
              </div>
              <p className="text-xs font-semibold text-gray-700 leading-tight">{item.nama}</p>
              <p className="text-sm font-bold text-[#0d1f3c]">{formatRupiah(item.harga)}</p>
              {item.satuan && <p className="text-[11px] text-gray-400">{item.satuan}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section Background ───────────────────────────────────────
function BackgroundSection({ backgrounds }: { backgrounds: BgKatalog[] }) {
  return (
    <div className="mt-10 sm:mt-14">
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <h3 className="text-sm sm:text-base font-bold text-[#0d1f3c] whitespace-nowrap">Background Tersedia</h3>
        <div className="flex-1 h-px bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
        {backgrounds.map((bg) => {
          const bgStyle = BG_STYLE_MAP[bg.id]
            ? { background: BG_STYLE_MAP[bg.id] }
            : { backgroundColor: bg.warna }
          return (
            <div key={bg.id} className="flex flex-col items-center gap-1.5 sm:gap-2">
              <div
                className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-sm ${bg.warna === "#FFFFFF" ? "border-2 border-gray-200" : ""}`}
                style={bgStyle}
                aria-label={`Background ${bg.nama}`}
                role="img"
              />
              <span className="text-[11px] sm:text-xs text-gray-600 font-medium text-center leading-tight">
                {bg.nama}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────
const KATEGORI_URUTAN: KategoriSesi[] = ["wisuda", "prewed", "keluarga", "group", "portrait"]

export function PaketSection({ katalog }: PaketSectionProps) {
  // Fallback ke constants jika katalog tidak tersedia
  const paketList: PaketKatalog[] = katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))

  const backgrounds: BgKatalog[] = katalog?.backgrounds ?? BACKGROUNDS.map((b) => ({
    id: b.id, nama: b.nama, warna: b.warna,
  }))

  // Hanya tampilkan kategori yang punya paket aktif
  const kategoriAktif = KATEGORI_URUTAN.filter((k) => paketList.some((p) => p.kategori === k))
  const defaultKat = kategoriAktif[0] ?? "wisuda"

  return (
    <section id="paket" className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-12">
          <span className="text-[#C9A84C] text-sm font-semibold tracking-widest uppercase">
            Pilih Paket
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-3 mb-3 sm:mb-4">
            Pilih Paket Sesuai Momenmu
          </h2>
          <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
            Sudah include <span className="font-semibold text-gray-700">all edit foto</span> + link Google Drive max 1×12 jam
          </p>
        </div>

        <Tabs defaultValue={defaultKat}>
          <div className="overflow-x-auto pb-1">
            <TabsList className="h-auto p-1.5 bg-gray-100 rounded-xl gap-1 w-max mx-auto flex">
              {kategoriAktif.map((kat) => (
                <TabsTrigger
                  key={kat}
                  value={kat}
                  className="px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap
                    data-[state=active]:bg-[#0d1f3c] data-[state=active]:text-white
                    data-[state=inactive]:text-gray-500 data-[state=inactive]:hover:text-gray-800
                    transition-all"
                >
                  {KATEGORI_LABEL[kat]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {kategoriAktif.map((kat) => {
            const paketKat = paketList.filter((p) => p.kategori === kat)
            return (
              <TabsContent key={kat} value={kat} className="mt-8">
                <div className={`grid gap-6 pt-6 ${paketKat.length === 1 ? "" : "grid-cols-1 sm:grid-cols-3"}`}>
                  {paketKat.map((paket) => (
                    <PaketCard
                      key={paket.id}
                      paket={paket}
                      lebar={paketKat.length === 1 ? "lega" : "normal"}
                    />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        <AddOnSection katalog={katalog} />
        <BackgroundSection backgrounds={backgrounds} />

        <p className="text-center text-xs sm:text-sm text-gray-400 mt-8 sm:mt-10">
          DP minimum Rp 100.000 · Pembayaran via transfer · Konfirmasi via WhatsApp
        </p>
      </div>
    </section>
  )
}
