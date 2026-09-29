"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { useWaitingListStore } from "@/lib/waiting-list-store"
import { WaitingListStepper } from "@/components/waiting-list/waiting-list-stepper"
import { RingkasanWaitingList } from "@/components/waiting-list/ringkasan-waiting-list"
import { Step1PilihPaketWaitingList } from "@/components/waiting-list/step1-paket"
import { Step2DetailWaitingList } from "@/components/waiting-list/step2-detail"
import { Step3KonfirmasiWaitingList } from "@/components/waiting-list/step3-konfirmasi"
import { Step4PembayaranWaitingList } from "@/components/waiting-list/step4-pembayaran"
import type { KatalogData } from "@/lib/katalog-types"

interface WaitingListFormProps {
  katalog: KatalogData
}

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1:
      return <Step1PilihPaketWaitingList />
    case 2:
      return <Step2DetailWaitingList />
    case 3:
      return <Step3KonfirmasiWaitingList />
    case 4:
      return <Step4PembayaranWaitingList />
    default:
      return null
  }
}

export function WaitingListForm({ katalog }: WaitingListFormProps) {
  const { currentStep, setKatalog } = useWaitingListStore()

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
          <div className="flex items-center gap-3">
            <span className="text-xs bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#E5C97A] px-2.5 py-0.5 rounded-full font-medium">
              Waiting List
            </span>
            <span className="text-sm font-semibold text-[#C9A84C]">
              Desara Home Studio
            </span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5">
          <WaitingListStepper />
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
            <RingkasanWaitingList />
          </div>
        </div>
      </div>
    </div>
  )
}
