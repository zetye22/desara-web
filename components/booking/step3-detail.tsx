"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronRight, ChevronLeft, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBookingStore } from "@/lib/booking-store"
import { detailSchema, type DetailFormValues } from "@/lib/booking-schema"
import { SEMUA_PAKET, BACKGROUNDS, ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"
import type { BgKatalog, PaketKatalog } from "@/lib/katalog-types"

function PilihBackground() {
  const { paketId, addons, backgroundDipilih, setBackground, setAddon, katalog } = useBookingStore()

  const semuaPaket: PaketKatalog[] = katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))
  const paket = semuaPaket.find((p) => p.id === paketId)
  if (!paket) return null

  const backgrounds: BgKatalog[] = katalog?.backgrounds ?? BACKGROUNDS.map((b) => ({
    id: b.id, nama: b.nama, warna: b.warna,
  }))

  const hargaTambahanBg = katalog?.addon.tambahanBackground.harga ?? ADD_ONS.tambahanBackground.harga

  const maxBg = paket.jumlahBackground + addons.tambahanBackground
  const kurangBg = backgroundDipilih.length < maxBg

  const toggleBg = (bgId: string) => {
    if (backgroundDipilih.includes(bgId)) {
      setBackground(backgroundDipilih.filter((id) => id !== bgId))
    } else if (backgroundDipilih.length < maxBg) {
      setBackground([...backgroundDipilih, bgId])
    } else {
      // Sudah penuh → tambah BG add-on otomatis
      setAddon("tambahanBackground", addons.tambahanBackground + 1)
      setBackground([...backgroundDipilih, bgId])
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <h3 className="text-base font-bold text-[#0d1f3c]">Pilih Background</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Pilih {maxBg} background (sudah dipilih: {backgroundDipilih.length}/{maxBg})
          </p>
        </div>
        {backgroundDipilih.length > paket.jumlahBackground && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
            +{backgroundDipilih.length - paket.jumlahBackground} BG (+{formatRupiah(hargaTambahanBg * (backgroundDipilih.length - paket.jumlahBackground))})
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {backgrounds.map((bg) => {
          const isSelected = backgroundDipilih.includes(bg.id)
          const isFull = !isSelected && backgroundDipilih.length >= maxBg
          const isWhite = bg.warna === "#FFFFFF" || bg.warna === "#ffffff"

          return (
            <button
              key={bg.id}
              onClick={() => toggleBg(bg.id)}
              aria-pressed={isSelected}
              aria-label={`Background ${bg.nama}`}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-1
                ${isSelected
                  ? "border-[#C9A84C] bg-[#C9A84C]/5"
                  : isFull
                  ? "border-gray-100 opacity-40 cursor-not-allowed"
                  : "border-gray-200 hover:border-gray-300"
                }`}
              disabled={isFull}
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full ${isWhite ? "border border-gray-300" : ""}`}
                  style={{ backgroundColor: bg.warna }}
                />
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-[#C9A84C] flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-600 text-center leading-tight">{bg.nama}</span>
            </button>
          )
        })}
      </div>

      {kurangBg && backgroundDipilih.length > 0 && (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Pilih {maxBg - backgroundDipilih.length} background lagi
        </div>
      )}
    </div>
  )
}

export function Step3Detail() {
  const {
    paketId, addons, namaClient, noWa, email, jumlahOrang, catatan, katalog,
    setFormDetail, nextStep, prevStep, backgroundDipilih,
  } = useBookingStore()

  const semuaPaket: PaketKatalog[] = katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))
  const paket = semuaPaket.find((p) => p.id === paketId)
  const maxOrangPaket = paket?.maxOrang ?? null
  const maxOrang = maxOrangPaket ? maxOrangPaket + addons.tambahanOrang : null

  const { register, handleSubmit, watch, formState: { errors } } = useForm<DetailFormValues>({
    resolver: zodResolver(detailSchema),
    defaultValues: { namaClient, noWa, email, jumlahOrang, catatan },
  })

  const orangInput = watch("jumlahOrang")
  const orangMelebihi = maxOrangPaket && orangInput > (maxOrang ?? Infinity)
  const bgLengkap = backgroundDipilih.length === (paket?.jumlahBackground ?? 0) + addons.tambahanBackground

  const onSubmit = (data: DetailFormValues) => {
    setFormDetail(data)
    nextStep()
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Detail Booking</h2>
      <p className="text-sm text-gray-500 mb-6">Lengkapi data diri dan pilih background</p>

      <PilihBackground />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="namaClient">Nama Lengkap *</Label>
          <Input id="namaClient" placeholder="Nama sesuai identitas" className="mt-1.5"
            {...register("namaClient")} />
          {errors.namaClient && <p className="text-xs text-red-500 mt-1">{errors.namaClient.message}</p>}
        </div>

        <div>
          <Label htmlFor="noWa">Nomor WhatsApp *</Label>
          <Input id="noWa" placeholder="081234567890" className="mt-1.5"
            {...register("noWa")} />
          {errors.noWa && <p className="text-xs text-red-500 mt-1">{errors.noWa.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email (opsional)</Label>
          <Input id="email" type="email" placeholder="email@contoh.com" className="mt-1.5"
            {...register("email")} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        {paket?.maxOrang && (
          <div>
            <Label htmlFor="jumlahOrang">
              Jumlah Orang *
              {maxOrangPaket && (
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (paket maks. {maxOrangPaket} orang)
                </span>
              )}
            </Label>
            <Input id="jumlahOrang" type="number" min={1} className="mt-1.5"
              {...register("jumlahOrang", { valueAsNumber: true })} />
            {orangMelebihi && (
              <div className="mt-1.5 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Melebihi kapasitas paket. Tambahan orang akan otomatis dihitung sebagai add-on.
              </div>
            )}
            {errors.jumlahOrang && <p className="text-xs text-red-500 mt-1">{errors.jumlahOrang.message}</p>}
          </div>
        )}

        <div>
          <Label htmlFor="catatan">Catatan Khusus (opsional)</Label>
          <textarea id="catatan" rows={3}
            placeholder="Permintaan khusus, tema foto, dll."
            className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
            {...register("catatan")} />
          {errors.catatan && <p className="text-xs text-red-500 mt-1">{errors.catatan.message}</p>}
        </div>

        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={prevStep} className="rounded-full px-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
          </Button>
          <Button type="submit" disabled={!bgLengkap}
            className="bg-[#0d1f3c] hover:bg-[#1a3a6e] text-white rounded-full px-8 h-11 font-semibold disabled:opacity-40">
            Lanjut ke Konfirmasi
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </div>
  )
}
