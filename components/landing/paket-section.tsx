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
  const handleMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    e.currentTarget.style.transition = "transform 0.1s ease"
    e.currentTarget.style.transform = `perspective(1200px) rotateX(${-y*7}deg) rotateY(${x*7}deg) translateZ(10px)`
  }
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transition = "transform 0.6s cubic-bezier(0.16,1,0.3,1)"
    e.currentTarget.style.transform = "perspective(1200px) rotateX(0) rotateY(0) translateZ(0)"
  }

  return (
    <article
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative flex flex-col rounded-2xl bg-white h-full
        shadow-sm focus-within:ring-2 focus-within:ring-[#C9A84C] focus-within:ring-offset-2
        ${paket.popular
          ? "gradient-border shadow-xl shadow-[#C9A84C]/15"
          : "border border-gray-200 hover:border-gray-300 hover:shadow-xl"
        }
        ${lebar === "lega" ? "max-w-lg mx-auto w-full" : ""}
      `}
    >
      {paket.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-[#C9A84C] to-[#b8963d] hover:from-[#b8963d] hover:to-[#C9A84C] text-white px-4 py-1.5 text-[11px] font-bold shadow-lg tracking-wide whitespace-nowrap">
            ⭐ PALING POPULER
          </Badge>
        </div>
      )}

      {/* Header paket */}
      <div className={`rounded-t-2xl px-5 sm:px-6 pt-7 sm:pt-9 pb-5 sm:pb-6 relative overflow-hidden ${
        paket.popular ? "bg-gradient-to-br from-[#0d1f3c] to-[#1a3a6e]" : "bg-gradient-to-br from-gray-50 to-gray-100/50"
      }`}>
        {paket.popular && (
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C9A84C]/8 blur-2xl pointer-events-none" />
        )}
        <p className={`text-[10px] font-bold tracking-[0.2em] uppercase mb-2 ${paket.popular ? "text-[#C9A84C]" : "text-gray-400"}`}>
          {KATEGORI_LABEL[paket.kategori]}
        </p>
        <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${paket.popular ? "text-white" : "text-[#0d1f3c]"}`}>
          {paket.nama}
        </h3>
        <div>
          {paket.hargaMulaiDari && (
            <span className={`text-xs block mb-0.5 ${paket.popular ? "text-blue-200/50" : "text-gray-400"}`}>
              Mulai dari
            </span>
          )}
          <span className={`text-3xl sm:text-4xl font-bold ${paket.popular ? "text-gradient-gold" : "text-[#C9A84C]"}`}>
            {formatRupiah(paket.harga)}
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 flex flex-col flex-1">
        {/* Specs */}
        <ul className="space-y-2.5 mb-4">
          <li className="flex items-center gap-3 text-sm text-gray-700">
            <span className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />
            </span>
            <span>{paket.durasiMenit} menit sesi foto</span>
          </li>
          <li className="flex items-center gap-3 text-sm text-gray-700">
            <span className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-3.5 h-3.5 text-[#C9A84C]" />
            </span>
            <span>{paket.jumlahBackground} background pilihan</span>
          </li>
          {paket.maxOrang && (
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                <Users className="w-3.5 h-3.5 text-[#C9A84C]" />
              </span>
              <span>Maks. {paket.maxOrang} orang</span>
            </li>
          )}
          {paket.cetakInclude && (
            <li className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-7 h-7 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                <Printer className="w-3.5 h-3.5 text-[#C9A84C]" />
              </span>
              <span>Cetak {paket.cetakInclude} + Frame</span>
            </li>
          )}
        </ul>

        <div className="border-t border-dashed border-gray-200 my-4" />

        {/* Includes */}
        <ul className="space-y-2 mb-6">
          {INCLUDED_ALL_PAKET.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5 text-green-600" strokeWidth={3} />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button
          asChild
          className={`mt-auto w-full rounded-full font-semibold h-11 transition-all duration-300 ${
            paket.popular
              ? "bg-[#C9A84C] hover:bg-[#b8963d] text-white shadow-md hover:shadow-lg hover:shadow-[#C9A84C]/30"
              : "bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white"
          }`}
        >
          <a href={`/booking?paket=${paket.id}`}>Pilih Paket Ini</a>
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
        <div className="text-center mb-10 sm:mb-14 reveal">
          <span className="inline-block text-[#C9A84C] text-xs font-bold tracking-[0.25em] uppercase mb-4 px-4 py-1.5 rounded-full bg-[#C9A84C]/8 border border-[#C9A84C]/15">
            Pilih Paket
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#0d1f3c] mt-1 mb-4">
            Paket Sesuai <span className="text-[#C9A84C]">Momenmu</span>
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
                <div className={`grid gap-6 pt-6 ${paketKat.length === 1 ? "" : "grid-cols-1 sm:grid-cols-3"}`} data-stagger="100">
                  {paketKat.map((paket) => (
                    <div key={paket.id} className="reveal h-full">
                      <PaketCard
                        paket={paket}
                        lebar={paketKat.length === 1 ? "lega" : "normal"}
                      />
                    </div>
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
