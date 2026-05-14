"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useBookingStore } from "@/lib/booking-store"
import { Stepper } from "@/components/booking/stepper"
import { RingkasanPesanan } from "@/components/booking/ringkasan-pesanan"
import { Step1PilihPaket } from "@/components/booking/step1-pilih-paket"
import { Step2PilihJadwal } from "@/components/booking/step2-pilih-jadwal"
import { Step3Detail } from "@/components/booking/step3-detail"
import { Step4Konfirmasi } from "@/components/booking/step4-konfirmasi"
import type { KatalogData } from "@/lib/katalog-types"

interface BookingFormProps {
  katalog: KatalogData
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1PilihPaket />
    case 2: return <Step2PilihJadwal />
    case 3: return <Step3Detail />
    case 4: return <Step4Konfirmasi />
    default: return null
  }
}

export function BookingForm({ katalog }: BookingFormProps) {
  const { currentStep, setKatalog } = useBookingStore()

  // Simpan katalog ke store saat pertama kali render
  useEffect(() => {
    setKatalog(katalog)
  }, [katalog, setKatalog])

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      {/* Header */}
      <div className="bg-[#0d1f3c] text-white py-4 px-4 md:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-blue-200 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Link>
          <span className="text-sm font-semibold text-[#C9A84C]">
            Desara Home Studio
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5">
          <Stepper />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_280px] gap-8 items-start">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
            <div
              key={currentStep}
              className="animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <StepContent step={currentStep} />
            </div>
          </div>
          <div>
            <RingkasanPesanan />
          </div>
        </div>
      </div>
    </div>
  )
}
