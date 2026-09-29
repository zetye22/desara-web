"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, MessageCircle, Home, Calendar, Clock, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useWaitingListStore } from "@/lib/waiting-list-store"

const WA_STUDIO = "6282148832027"

export default function WaitingListSuksesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <SuksesContent />
    </Suspense>
  )
}

function SuksesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get("id") ?? ""
  const { waitingListResult, reset } = useWaitingListStore()

  useEffect(() => {
    if (!idParam && !waitingListResult) {
      router.replace("/")
    }
  }, [idParam, waitingListResult, router])

  const nama = waitingListResult?.nama_client || "Client"
  const paket = waitingListResult?.nama_paket || "Paket Foto"

  const pesanWA = encodeURIComponent(
    `Halo Desara Home Studio, saya sudah mendaftar antrean Waiting List atas nama *${nama}* untuk paket *${paket}*. Mohon infonya jika ada jadwal/slot yang tersedia. Terima kasih!`
  )

  const waLink = `https://wa.me/${WA_STUDIO}?text=${pesanWA}`

  return (
    <div className="min-h-screen bg-[#F8F5F0] py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
          {/* Icon Sukses */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#C9A84C] bg-[#C9A84C]/10 px-3 py-1 rounded-full mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Antrean Terdaftar
          </span>

          <h1 className="text-2xl font-bold text-[#0d1f3c] mb-2">
            Terima Kasih, {nama}!
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Data pesanan foto Anda untuk <strong className="text-gray-800">{paket}</strong> sudah masuk ke antrean Waiting List Desara Home Studio.
          </p>

          {/* Kartu Info Langkah Selanjutnya */}
          <div className="bg-[#0d1f3c]/5 border border-[#0d1f3c]/10 rounded-2xl p-4 text-left mb-6 space-y-3">
            <h3 className="text-xs font-bold text-[#0d1f3c] uppercase tracking-wide">
              Langkah Selanjutnya:
            </h3>
            <div className="flex items-start gap-2.5 text-xs text-gray-600">
              <Calendar className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
              <span>
                Admin kami akan mengontak WhatsApp Anda untuk mengonfirmasi tanggal & jam sesi yang Anda inginkan.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-gray-600">
              <Clock className="w-4 h-4 text-[#C9A84C] shrink-0 mt-0.5" />
              <span>
                <strong>Wajib Pembayaran DP:</strong> Begitu jadwal fix disepakati, silakan lakukan pembayaran DP untuk mengunci slot booking Anda.
              </span>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-colors shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Kabari Admin via WhatsApp
            </a>

            <Link
              href="/"
              onClick={() => reset()}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-xl text-sm transition-colors"
            >
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
