"use client"

import { Check } from "lucide-react"
import { useBookingStore } from "@/lib/booking-store"

const STEPS = [
  { no: 1, label: "Pilih Paket" },
  { no: 2, label: "Tanggal & Jam" },
  { no: 3, label: "Detail" },
  { no: 4, label: "Konfirmasi" },
]

export function Stepper() {
  const { currentStep, goToStep } = useBookingStore()

  return (
    <nav aria-label="Langkah booking" className="w-full">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.no
          const isActive = currentStep === step.no
          const canGoBack = isCompleted

          return (
            <li key={step.no} className="flex items-center">
              {/* Circle */}
              <button
                onClick={() => canGoBack && goToStep(step.no)}
                disabled={!canGoBack}
                aria-current={isActive ? "step" : undefined}
                className={`flex flex-col items-center gap-1.5 group focus:outline-none ${
                  canGoBack ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-[#0d1f3c] text-white ring-4 ring-[#0d1f3c]/20"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.no}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                    isActive
                      ? "text-[#0d1f3c]"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-20 mx-1 sm:mx-2 transition-colors ${
                    currentStep > step.no ? "bg-green-400" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
