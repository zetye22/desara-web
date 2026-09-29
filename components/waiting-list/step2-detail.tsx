"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ChevronRight, ChevronLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useWaitingListStore } from "@/lib/waiting-list-store"
import { SEMUA_PAKET, BACKGROUNDS, ADD_ONS } from "@/lib/constants"
import { formatRupiah } from "@/lib/utils"
import type { BgKatalog, PaketKatalog } from "@/lib/katalog-types"

const noWaRegex = /^(\+62|62|0)8[1-9][0-9]{7,11}$/

const detailWaitingListSchema = z.object({
  namaClient: z.string().min(2, "Nama minimal 2 karakter").max(80, "Nama terlalu panjang"),
  noWa: z.string().regex(noWaRegex, "Format WhatsApp tidak valid (contoh: 081234567890)"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  jumlahOrang: z.number().int().min(1, "Minimal 1 orang"),
  preferensiJadwal: z.string().max(200, "Maksimal 200 karakter").optional(),
  catatan: z.string().max(300, "Catatan maksimal 300 karakter").optional(),
})

type DetailFormValues = z.infer<typeof detailWaitingListSchema>

function PilihBackground() {
  const { paketId, addons, backgroundDipilih, setBackground, setAddon, katalog } = useWaitingListStore()

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

  const toggleBg = (bgId: string) => {
    if (backgroundDipilih.includes(bgId)) {
      setBackground(backgroundDipilih.filter((id) => id !== bgId))
    } else if (backgroundDipilih.length < maxBg) {
      setBackground([...backgroundDipilih, bgId])
    } else {
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
              type="button"
              onClick={() => toggleBg(bg.id)}
              aria-pressed={isSelected}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-[#C9A84C]
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
      {backgroundDipilih.length === 0 && (
        <p className="text-xs text-red-500 mt-2 font-medium">
          * Mohon pilih minimal 1 background favorit Anda
        </p>
      )}
    </div>
  )
}

export function Step2DetailWaitingList() {
  const {
    namaClient,
    noWa,
    email,
    jumlahOrang,
    preferensiJadwal,
    kampus,
    catatan,
    backgroundDipilih,
    setFormDetail,
    nextStep,
    prevStep,
  } = useWaitingListStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DetailFormValues>({
    resolver: zodResolver(detailWaitingListSchema),
    defaultValues: {
      namaClient,
      noWa,
      email,
      jumlahOrang: jumlahOrang || 1,
      preferensiJadwal,
      kampus,
      catatan,
    },
  })

  const onSubmit = (values: DetailFormValues) => {
    if (backgroundDipilih.length === 0) return
    setFormDetail({
      namaClient: values.namaClient,
      noWa: values.noWa,
      email: values.email ?? "",
      jumlahOrang: values.jumlahOrang,
      preferensiJadwal: values.preferensiJadwal ?? "",
      kampus: values.kampus ?? "",
      catatan: values.catatan ?? "",
    })
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Data Client & Preferensi</h2>
      <p className="text-sm text-gray-500 mb-6">
        Informasi ini akan digunakan oleh admin kami untuk menghubungi Anda saat jadwal tersedia
      </p>

      {/* Pilih Background */}
      <PilihBackground />

      <div className="space-y-4 max-w-lg">
        {/* Nama */}
        <div>
          <Label htmlFor="namaClient" className="text-sm font-semibold text-gray-700">
            Nama Lengkap <span className="text-red-500">*</span>
          </Label>
          <Input
            id="namaClient"
            placeholder="Contoh: Rina Santoso"
            {...register("namaClient")}
            className="mt-1.5 h-11 rounded-xl"
          />
          {errors.namaClient && (
            <p className="text-xs text-red-500 mt-1">{errors.namaClient.message}</p>
          )}
        </div>

        {/* WhatsApp */}
        <div>
          <Label htmlFor="noWa" className="text-sm font-semibold text-gray-700">
            Nomor WhatsApp <span className="text-red-500">*</span>
          </Label>
          <Input
            id="noWa"
            type="tel"
            placeholder="Contoh: 081234567890"
            {...register("noWa")}
            className="mt-1.5 h-11 rounded-xl"
          />
          {errors.noWa && (
            <p className="text-xs text-red-500 mt-1">{errors.noWa.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Email <span className="text-gray-400 font-normal">(opsional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Contoh: rina@gmail.com"
            {...register("email")}
            className="mt-1.5 h-11 rounded-xl"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Kampus / Instansi */}
        <div>
          <Label htmlFor="kampus" className="text-sm font-semibold text-gray-700">
            Kampus / Instansi <span className="text-gray-400 font-normal">(opsional)</span>
          </Label>
          <Input
            id="kampus"
            placeholder="Contoh: UGM, UNY, UIN, Telkom, Dsb."
            {...register("kampus")}
            className="mt-1.5 h-11 rounded-xl"
          />
          {errors.kampus && (
            <p className="text-xs text-red-500 mt-1">{errors.kampus.message}</p>
          )}
        </div>

        {/* Jumlah Orang */}
        <div>
          <Label htmlFor="jumlahOrang" className="text-sm font-semibold text-gray-700">
            Jumlah Orang yang Ikut Sesi <span className="text-red-500">*</span>
          </Label>
          <Input
            id="jumlahOrang"
            type="number"
            min={1}
            max={50}
            {...register("jumlahOrang", { valueAsNumber: true })}
            className="mt-1.5 h-11 rounded-xl"
          />
          {errors.jumlahOrang && (
            <p className="text-xs text-red-500 mt-1">{errors.jumlahOrang.message}</p>
          )}
        </div>

        {/* Preferensi Jadwal */}
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
          <Label htmlFor="preferensiJadwal" className="text-sm font-semibold text-[#0d1f3c]">
            Perkiraan Tanggal / Preferensi Hari
          </Label>
          <p className="text-xs text-gray-500 mt-0.5 mb-2">
            Contoh: &quot;Akhir bulan ini&quot;, &quot;Weekend sore sekitar tgl 15-20&quot;, atau &quot;Tergantung info wisuda kampus&quot;
          </p>
          <Input
            id="preferensiJadwal"
            placeholder="Tuliskan rentang atau hari yang Anda inginkan..."
            {...register("preferensiJadwal")}
            className="h-11 bg-white rounded-xl"
          />
          {errors.preferensiJadwal && (
            <p className="text-xs text-red-500 mt-1">{errors.preferensiJadwal.message}</p>
          )}
        </div>

        {/* Catatan */}
        <div>
          <Label htmlFor="catatan" className="text-sm font-semibold text-gray-700">
            Catatan Tambahan <span className="text-gray-400 font-normal">(opsional)</span>
          </Label>
          <textarea
            id="catatan"
            rows={3}
            placeholder="Contoh: Bawa toga sendiri, ingin konsep kasual, dsb."
            {...register("catatan")}
            className="mt-1.5 w-full rounded-xl border border-gray-200 p-3 text-sm focus:border-[#C9A84C] focus:outline-none focus:ring-1 focus:ring-[#C9A84C]"
          />
          {errors.catatan && (
            <p className="text-xs text-red-500 mt-1">{errors.catatan.message}</p>
          )}
        </div>
      </div>

      {/* Navigasi */}
      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={prevStep}
          className="rounded-full px-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <Button
          type="submit"
          disabled={backgroundDipilih.length === 0}
          className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-8 h-11 font-semibold disabled:opacity-40"
        >
          Lanjut ke Konfirmasi
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </form>
  )
}
