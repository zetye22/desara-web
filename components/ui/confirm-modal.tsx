"use client"

import { useEffect, useRef } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  // Fokus ke tombol batal saat modal buka (aksesibilitas)
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  // Tutup dengan Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onCancel])

  if (!open) return null

  const isDanger = variant === "danger"

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
          isDanger ? "bg-red-100" : "bg-amber-100"
        }`}>
          {isDanger
            ? <Trash2 className="w-6 h-6 text-red-600" />
            : <AlertTriangle className="w-6 h-6 text-amber-600" />
          }
        </div>

        {/* Teks */}
        <h3 className="text-base font-bold text-gray-800 text-center mb-1">{title}</h3>
        <p className="text-sm text-gray-500 text-center leading-relaxed">{message}</p>

        {/* Tombol */}
        <div className="flex gap-3 mt-6">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition ${
              isDanger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-500 hover:bg-amber-600"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
