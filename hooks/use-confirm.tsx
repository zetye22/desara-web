"use client"

import { useState, useCallback } from "react"
import { ConfirmModal } from "@/components/ui/confirm-modal"

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning"
}

// Hook yang menggantikan window.confirm() dengan modal yang proper
// Contoh pakai:
//   const { confirm, ConfirmDialog } = useConfirm()
//   const ok = await confirm({ title: "Hapus?", message: "..." })
//   if (!ok) return
//   // ...lanjut hapus
//   // Di JSX: <ConfirmDialog />
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    opts: ConfirmOptions
    resolve?: (v: boolean) => void
  }>({ open: false, opts: { title: "", message: "" } })

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, opts, resolve })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setState((s) => { s.resolve?.(true); return { ...s, open: false } })
  }, [])

  const handleCancel = useCallback(() => {
    setState((s) => { s.resolve?.(false); return { ...s, open: false } })
  }, [])

  function ConfirmDialog() {
    return (
      <ConfirmModal
        open={state.open}
        title={state.opts.title}
        message={state.opts.message}
        confirmLabel={state.opts.confirmLabel}
        cancelLabel={state.opts.cancelLabel}
        variant={state.opts.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    )
  }

  return { confirm, ConfirmDialog }
}
