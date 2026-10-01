"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Copy, CheckCircle2, CreditCard, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useWaitingListStore } from "@/lib/waiting-list-store"
import { hitungHarga } from "@/lib/harga-booking"
import { formatRupiah } from "@/lib/utils"

const REKENING = "BNI 1990890597 a.n. Edwin Desara"

export function Step4PembayaranWaitingList() {
  const router = useRouter()
  const store = useWaitingListStore()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const rincian = hitungHarga(store.paketId, store.addons, store.katalog)

  const copyRekening = () => {
    navigator.clipboard.writeText(REKENING)
    setCopied(true)
    toast.success("Nomor rekening disalin!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async () => {
    if (!store.paketId || !store.kategori || !store.namaClient || !store.noWa) {
      toast.error("Data tidak lengkap. Mohon periksa kembali formulir Anda.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/waiting-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kategori_sesi: store.kategori,
          paket_id: store.paketId,
          nama_client: store.namaClient,
          no_wa: store.noWa,
          email: store.email || "",
          jumlah_orang: store.jumlahOrang,
          background_dipilih: store.backgroundDipilih,
          addons: store.addons,
          preferensi_jadwal: store.preferensiJadwal || undefined,
          jam_diinginkan: store.jamDiinginkan || undefined,
          catatan: [
            store.kampus ? `[Kampus/Instansi]: ${store.kampus}` : "",
            store.catatan || "",
          ]
            .filter(Boolean)
            .join("\n") || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Gagal mendaftar antrean. Silakan coba lagi.")
        return
      }

      store.setWaitingListResult({
        id: json.id,
        nama_client: store.namaClient,
        no_wa: store.noWa,
        nama_paket: rincian.namaPaket,
        total_tagihan: json.total_tagihan ?? rincian.total,
        dp_minimum: json.dp_minimum ?? rincian.dpMinimum,
      })

      router.push(`/waiting-list/sukses?id=${encodeURIComponent(json.id)}`)
    } catch (err) {
      console.error(err)
      toast.error("Terjadi masalah jaringan. Silakan coba beberapa saat lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <CreditCard className="w-5 h-5 text-[#C9A84C]" />
        <h2 className="text-xl font-bold text-[#0d1f3c]">Pembayaran DP Waiting List</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Informasi rekening transfer DP untuk mengunci slot antrean Anda
      </p>

      {/* Box Info Nominal & Rekening */}
      <div className="bg-[#0d1f3c] text-white rounded-2xl p-6 mb-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A84C]/10 rounded-full blur-2xl pointer-events-none" />
        <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">
          Nominal DP Wajib Ditransfer
        </p>
        <p className="text-3xl font-extrabold text-[#C9A84C] mt-1 mb-4">
          {formatRupiah(rincian.dpMinimum)}
        </p>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs text-blue-200 mb-1.5 font-medium">Rekening Tujuan Transfer:</p>
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <span className="font-semibold text-sm sm:text-base tracking-wide text-white">
              {REKENING}
            </span>
            <button
              type="button"
              onClick={copyRekening}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A84C] hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Salin
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Petunjuk Transfer */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 mb-6 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-950 text-sm">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" /> Petunjuk Alur Pembayaran DP:
        </div>
        <ol className="list-decimal list-inside space-y-1 text-amber-800 leading-relaxed pl-1">
          <li>Transfer DP sebesar <strong>{formatRupiah(rincian.dpMinimum)}</strong> ke rekening BNI di atas.</li>
          <li>Klik tombol <strong>&quot;Selesaikan Pendaftaran Waiting List&quot;</strong> di bawah ini.</li>
          <li>Kirimkan bukti transfer Anda kepada Admin melalui link WhatsApp di halaman selanjutnya.</li>
          <li>Admin kami akan mengonfirmasi slot antrean & mencocokkan jadwal foto Anda.</li>
        </ol>
      </div>

      {/* Navigasi */}
      <div className="mt-8 flex justify-between items-center">
        <Button
          type="button"
          variant="outline"
          onClick={store.prevStep}
          disabled={loading}
          className="rounded-full px-6"
        >
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
              Menyimpan Data…
            </>
          ) : (
            "Selesaikan Pendaftaran Waiting List"
          )}
        </Button>
      </div>
    </div>
  )
}
