"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Upload, X, FileImage } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useBookingStore } from "@/lib/booking-store"
import { hitungHarga } from "@/lib/harga-booking"
import { formatRupiah, formatTanggal } from "@/lib/utils"
import { SEMUA_PAKET, BACKGROUNDS, KATEGORI_LABEL } from "@/lib/constants"
import type { KategoriSesi } from "@/types"
import type { PaketKatalog } from "@/lib/katalog-types"

export function Step4Konfirmasi() {
  const router = useRouter()
  const store  = useBookingStore()

  const [loading, setLoading]   = useState(false)
  const [fileBukti, setFileBukti] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const rincian   = hitungHarga(store.paketId, store.addons, store.katalog)

  const semuaPaket: PaketKatalog[] = store.katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`, id: p.id, nama: p.nama, kategori: p.kategori,
    harga: p.harga, hargaMulaiDari: p.hargaMulaiDari, durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground, maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null, popular: p.popular ?? false,
  }))
  const paket = semuaPaket.find((p) => p.id === store.paketId)

  const semuaBg = store.katalog?.backgrounds ?? BACKGROUNDS.map((b) => ({ id: b.id, nama: b.nama, warna: b.warna }))
  const bgDipilih = semuaBg.filter((b) => store.backgroundDipilih.includes(b.id))

  // ── File upload handler ────────────────────────────────────────
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5 MB")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Format file harus JPG, PNG, atau WebP")
      return
    }
    setFileBukti(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      const fake = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>
      handleFilePick(fake)
    }
  }

  // ── Submit booking ─────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!store.paketId || !store.kategori || !store.tanggalFoto || !store.jamMulai) {
      toast.error("Data booking tidak lengkap. Mohon ulangi dari awal.")
      return
    }
    if (store.backgroundDipilih.length === 0) {
      toast.error("Pilih minimal 1 background. Kembali ke langkah sebelumnya.")
      return
    }

    setLoading(true)
    try {
      // 1. Buat booking
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori_sesi:      store.kategori,
          paket_id:           store.paketId,
          tgl_foto:           store.tanggalFoto,
          jam_mulai:          store.jamMulai,
          nama_client:        store.namaClient,
          no_wa:              store.noWa,
          email:              store.email || "",
          jumlah_orang:       store.jumlahOrang,
          background_dipilih: store.backgroundDipilih,
          addons:             store.addons,
          catatan:            store.catatan || undefined,
        }),
      })

      const json = await res.json() as {
        success?: boolean
        kode_booking?: string
        total_tagihan?: number
        dp_minimum?: number
        sisa_bayar?: number
        nama_paket?: string
        error?: string
      }

      if (!res.ok || !json.success || !json.kode_booking) {
        toast.error(json.error ?? "Gagal membuat booking. Silakan coba lagi.")
        return
      }

      // Simpan hasil ke store untuk halaman sukses
      store.setBookingResult({
        kode_booking:  json.kode_booking,
        total_tagihan: json.total_tagihan ?? rincian.total,
        dp_minimum:    json.dp_minimum ?? rincian.dpMinimum,
        sisa_bayar:    json.sisa_bayar ?? rincian.sisaBayar,
        nama_client:   store.namaClient,
        no_wa:         store.noWa,
        tgl_foto:      store.tanggalFoto,
        jam_mulai:     store.jamMulai,
        nama_paket:    json.nama_paket ?? paket?.nama ?? "",
      })

      // 2. Upload bukti transfer (opsional, tidak block jika gagal)
      if (fileBukti) {
        try {
          const fd = new FormData()
          fd.append("file", fileBukti)
          fd.append("kode_booking", json.kode_booking)
          const uploadRes = await fetch("/api/bookings/upload-bukti", { method: "POST", body: fd })
          if (!uploadRes.ok) {
            toast.warning("Booking berhasil tapi bukti transfer gagal terupload. Kirim ulang via WhatsApp ke admin ya.")
          }
        } catch {
          toast.warning("Booking berhasil tapi bukti transfer gagal terupload. Kirim ulang via WhatsApp ke admin ya.")
        }
      }

      // 3. Redirect ke halaman sukses
      router.push(`/booking/sukses?kode=${encodeURIComponent(json.kode_booking)}`)
    } catch (err) {
      console.error(err)
      toast.error("Terjadi kesalahan koneksi. Periksa internet dan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0d1f3c] mb-1">Konfirmasi Booking</h2>
      <p className="text-sm text-gray-500 mb-6">Periksa kembali detail booking Anda</p>

      <div className="space-y-4 max-w-lg">
        {/* Ringkasan detail */}
        <DetailRow label="Kategori">
          {store.kategori ? KATEGORI_LABEL[store.kategori as KategoriSesi] : "—"}
        </DetailRow>
        <DetailRow label="Paket">{paket?.nama ?? "—"}</DetailRow>
        <DetailRow label="Tanggal">
          {store.tanggalFoto ? formatTanggal(store.tanggalFoto + "T00:00:00") : "—"}
        </DetailRow>
        <DetailRow label="Jam Mulai">{store.jamMulai ?? "—"} WIB</DetailRow>
        <DetailRow label="Durasi">{rincian.durasiTotal} menit</DetailRow>
        <DetailRow label="Background">
          {bgDipilih.map((b) => b.nama).join(", ") || "—"}
        </DetailRow>
        <DetailRow label="Nama">{store.namaClient || "—"}</DetailRow>
        <DetailRow label="WhatsApp">{store.noWa || "—"}</DetailRow>
        {store.email && <DetailRow label="Email">{store.email}</DetailRow>}
        {store.jumlahOrang > 1 && (
          <DetailRow label="Jumlah Orang">{store.jumlahOrang} orang</DetailRow>
        )}
        {store.catatan && <DetailRow label="Catatan">{store.catatan}</DetailRow>}

        {/* Rincian harga */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Paket {rincian.namaPaket}</span>
            <span>{formatRupiah(rincian.subtotalPaket)}</span>
          </div>
          {rincian.addonItems.map((a) => (
            <div key={a.nama} className="flex justify-between text-sm text-gray-500">
              <span>+ {a.nama}</span>
              <span>{formatRupiah(a.harga)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
            <span>Total</span>
            <span className="text-[#C9A84C]">{formatRupiah(rincian.total)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>DP Minimum (bayar sekarang)</span>
            <span className="font-semibold text-green-700">{formatRupiah(rincian.dpMinimum)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Sisa Bayar di Studio</span>
            <span>{formatRupiah(rincian.sisaBayar)}</span>
          </div>
        </div>

        {/* Upload bukti transfer (opsional) */}
        <div className="border-t pt-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            Upload Bukti Transfer DP{" "}
            <span className="font-normal text-gray-400">(opsional, bisa dikirim via WA)</span>
          </p>

          {fileBukti ? (
            <div className="flex items-center gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
              <FileImage className="w-5 h-5 text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800 truncate">{fileBukti.name}</p>
                <p className="text-xs text-green-600">{(fileBukti.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => { setFileBukti(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                className="text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Hapus file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#C9A84C] hover:bg-[#C9A84C]/5 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Drag & drop atau <span className="text-[#C9A84C] font-medium">klik untuk pilih file</span>
              </p>
              <p className="text-xs text-gray-300 mt-1">JPG, PNG, WebP • Max 5 MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>
      </div>

      {/* Navigasi */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={store.prevStep} disabled={loading} className="rounded-full px-6">
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-8 h-11 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses…
            </>
          ) : (
            "Konfirmasi & Kirim Booking"
          )}
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{children}</span>
    </div>
  )
}
