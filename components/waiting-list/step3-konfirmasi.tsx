"use client"

import { ChevronLeft, Sparkles, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWaitingListStore } from "@/lib/waiting-list-store"
import { hitungHarga } from "@/lib/harga-booking"
import { formatRupiah } from "@/lib/utils"
import { SEMUA_PAKET, BACKGROUNDS, KATEGORI_LABEL } from "@/lib/constants"
import type { KategoriSesi } from "@/types"
import type { PaketKatalog } from "@/lib/katalog-types"

export function Step3KonfirmasiWaitingList() {
  const store = useWaitingListStore()

  const rincian = hitungHarga(store.paketId, store.addons, store.katalog)

  const semuaPaket: PaketKatalog[] = store.katalog?.paket ?? SEMUA_PAKET.map((p) => ({
    key: `paket_${p.id}`,
    id: p.id,
    nama: p.nama,
    kategori: p.kategori,
    harga: p.harga,
    hargaMulaiDari: p.hargaMulaiDari,
    durasiMenit: p.durasiMenit,
    jumlahBackground: p.jumlahBackground,
    maxOrang: p.maxOrang,
    cetakInclude: p.cetakInclude ?? null,
    popular: p.popular ?? false,
  }))
  const paket = semuaPaket.find((p) => p.id === store.paketId)

  const semuaBg = store.katalog?.backgrounds ?? BACKGROUNDS.map((b) => ({ id: b.id, nama: b.nama, warna: b.warna }))
  const bgDipilih = semuaBg.filter((b) => store.backgroundDipilih.includes(b.id))

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-[#C9A84C]" />
        <h2 className="text-xl font-bold text-[#0d1f3c]">Konfirmasi Waiting List</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Pastikan rincian sesi foto Anda sudah benar sebelum masuk ke daftar antrean
      </p>

      {/* Info Card DP Wajib */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-6 text-sm text-amber-900 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-950">Syarat Ketentuan Waiting List & Pembayaran DP</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            Pendaftaran waiting list **wajib membayar DP ({formatRupiah(rincian.dpMinimum)})**. Setelah Anda mendaftar, Admin Desara Studio akan mengontak WhatsApp Anda untuk mencocokkan jadwal. Transfer DP dilakukan setelah jadwal fix disepakati bersama.
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <DetailRow label="Kategori">
          {store.kategori ? KATEGORI_LABEL[store.kategori as KategoriSesi] : "—"}
        </DetailRow>
        <DetailRow label="Paket">{paket?.nama ?? "—"}</DetailRow>
        <DetailRow label="Durasi">{rincian.durasiTotal} menit</DetailRow>
        <DetailRow label="Background">
          {bgDipilih.map((b) => b.nama).join(", ") || "—"}
        </DetailRow>
        <DetailRow label="Nama Client">{store.namaClient || "—"}</DetailRow>
        <DetailRow label="Nomor WhatsApp">{store.noWa || "—"}</DetailRow>
        {store.email && <DetailRow label="Email">{store.email}</DetailRow>}
        {store.kampus && <DetailRow label="Kampus / Instansi">{store.kampus}</DetailRow>}
        <DetailRow label="Jumlah Peserta">{store.jumlahOrang} orang</DetailRow>
        {store.preferensiJadwal && (
          <DetailRow label="Preferensi Hari">
            <span className="text-[#C9A84C] font-semibold">{store.preferensiJadwal}</span>
          </DetailRow>
        )}
        {store.jamDiinginkan && (
          <DetailRow label="Jam yang Diinginkan">
            <span className="text-[#C9A84C] font-semibold">🕐 {store.jamDiinginkan} WIB</span>
          </DetailRow>
        )}
        {store.catatan && <DetailRow label="Catatan">{store.catatan}</DetailRow>}

        {/* Rincian Estimasi Biaya */}
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
            <span>Estimasi Total</span>
            <span className="text-[#C9A84C]">{formatRupiah(rincian.total)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold text-[#0d1f3c]">
            <span>DP Wajib Pembayaran</span>
            <span className="font-semibold text-[#C9A84C]">{formatRupiah(rincian.dpMinimum)}</span>
          </div>
        </div>
      </div>

      {/* Navigasi */}
      <div className="mt-8 flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={store.prevStep}
          className="rounded-full px-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Kembali
        </Button>
        <Button
          onClick={store.nextStep}
          className="bg-[#C9A84C] hover:bg-[#b8963d] text-white rounded-full px-8 h-11 font-semibold"
        >
          Lanjut ke Pembayaran DP
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-400 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{children}</span>
    </div>
  )
}
