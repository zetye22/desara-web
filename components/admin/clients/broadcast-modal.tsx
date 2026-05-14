"use client"

import { useState } from "react"
import { X, Send, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { Client } from "./types"

interface BroadcastModalProps {
  clients: Client[]
  onClose: () => void
}

interface SendResult {
  clientId: string
  nama: string
  status: "pending" | "sending" | "sent" | "failed"
  error?: string
}

const TEMPLATE_PROMO = `Halo {nama} 👋

Desara Home Studio hadir dengan promo spesial untuk kamu!

📸 Booking sekarang dan dapatkan penawaran terbaik.
📅 Hubungi kami untuk info lebih lanjut.

Desara Home Studio
📞 {wa_studio}`

const TEMPLATE_FOLLOW_UP = `Halo {nama} 😊

Sudah lama tidak bertemu! Kami kangen kamu di Desara Home Studio.

Ada momen spesial yang ingin diabadikan? Kami siap membantu 📸

Yuk booking sekarang, slot terbatas!

Desara Home Studio`

export function BroadcastModal({ clients, onClose }: BroadcastModalProps) {
  const [pesan, setPesan] = useState(TEMPLATE_PROMO)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResult[]>([])
  const [done, setDone] = useState(false)

  const broadcastId = crypto.randomUUID()

  function applyTemplate(template: string) {
    setPesan(template)
  }

  async function handleSend() {
    if (!pesan.trim()) { toast.error("Pesan tidak boleh kosong"); return }

    const ok = window.confirm(
      `Kirim pesan ke ${clients.length} client?\n\nPesan akan dikirim satu per satu dengan jeda 3 detik.`
    )
    if (!ok) return

    setSending(true)
    const initial: SendResult[] = clients.map((c) => ({
      clientId: c.id,
      nama: c.nama,
      status: "pending",
    }))
    setResults(initial)

    for (let i = 0; i < clients.length; i++) {
      const c = clients[i]

      // Update status ke sending
      setResults((prev) => prev.map((r) => r.clientId === c.id ? { ...r, status: "sending" } : r))

      // Personalisasi pesan
      const pesanPersonal = pesan.replace(/\{nama\}/gi, c.nama.split(" ")[0])

      try {
        const res = await fetch("/api/clients/send-wa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: c.id,
            no_wa: c.no_wa,
            pesan: pesanPersonal,
            broadcast_id: broadcastId,
          }),
        })

        if (res.ok) {
          setResults((prev) => prev.map((r) => r.clientId === c.id ? { ...r, status: "sent" } : r))
        } else {
          const data = await res.json()
          setResults((prev) => prev.map((r) =>
            r.clientId === c.id ? { ...r, status: "failed", error: data.error ?? "Gagal" } : r
          ))
        }
      } catch {
        setResults((prev) => prev.map((r) =>
          r.clientId === c.id ? { ...r, status: "failed", error: "Network error" } : r
        ))
      }

      // Jeda 3 detik antar pengiriman (kecuali yang terakhir)
      if (i < clients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }

    setSending(false)
    setDone(true)
    const sent = results.filter((r) => r.status === "sent").length
    toast.success(`Broadcast selesai: ${sent}/${clients.length} berhasil`)
  }

  const sentCount = results.filter((r) => r.status === "sent").length
  const failedCount = results.filter((r) => r.status === "failed").length

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={!sending ? onClose : undefined}>
      <div
        className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-[#0d1f3c]">Broadcast WhatsApp</h2>
            <p className="text-xs text-gray-500 mt-0.5">{clients.length} client dipilih</p>
          </div>
          {!sending && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!done ? (
            <>
              {/* Template pilihan */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Template Cepat</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => applyTemplate(TEMPLATE_PROMO)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                  >
                    Promo
                  </button>
                  <button
                    onClick={() => applyTemplate(TEMPLATE_FOLLOW_UP)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
                  >
                    Follow-up
                  </button>
                </div>
              </div>

              {/* Pesan */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                  Pesan <span className="text-gray-400 font-normal">(gunakan {"{nama}"} untuk nama client)</span>
                </label>
                <textarea
                  value={pesan}
                  onChange={(e) => setPesan(e.target.value)}
                  rows={8}
                  disabled={sending}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 resize-none disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1">{pesan.length} karakter</p>
              </div>

              {/* Daftar penerima */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Penerima</p>
                <div className="rounded-lg border border-gray-100 max-h-32 overflow-y-auto">
                  {clients.map((c) => (
                    <div key={c.id} className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 last:border-0">
                      <p className="text-xs text-gray-700">{c.nama}</p>
                      <p className="text-xs text-gray-400">{c.no_wa}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                Pesan dikirim satu per satu dengan jeda 3 detik. Jangan tutup halaman ini saat pengiriman berlangsung.
              </div>
            </>
          ) : (
            /* Hasil broadcast */
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-green-50 border border-green-200 p-3 text-center">
                  <p className="text-2xl font-bold text-green-700">{sentCount}</p>
                  <p className="text-xs text-green-600 mt-0.5">Berhasil</p>
                </div>
                <div className="flex-1 rounded-lg bg-red-50 border border-red-200 p-3 text-center">
                  <p className="text-2xl font-bold text-red-700">{failedCount}</p>
                  <p className="text-xs text-red-600 mt-0.5">Gagal</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 max-h-48 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.clientId} className="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
                    {r.status === "sent" && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    {r.status === "failed" && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    {r.status === "sending" && <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 animate-spin" />}
                    {r.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-700">{r.nama}</p>
                      {r.error && <p className="text-xs text-red-500">{r.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress saat sending */}
          {sending && results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Mengirim...</span>
                <span>{results.filter((r) => r.status === "sent" || r.status === "failed").length}/{clients.length}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0d1f3c] transition-all duration-300"
                  style={{
                    width: `${(results.filter((r) => r.status === "sent" || r.status === "failed").length / clients.length) * 100}%`
                  }}
                />
              </div>
              <div className="rounded-lg border border-gray-100 max-h-32 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.clientId} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50 last:border-0">
                    {r.status === "sent" && <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                    {r.status === "failed" && <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                    {r.status === "sending" && <Loader2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-spin" />}
                    {r.status === "pending" && <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 flex-shrink-0" />}
                    <p className="text-xs text-gray-600">{r.nama}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          {!done ? (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose} disabled={sending}>Batal</Button>
              <Button
                className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561] gap-2"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                ) : (
                  <><Send className="w-4 h-4" /> Kirim ke {clients.length} Client</>
                )}
              </Button>
            </>
          ) : (
            <Button className="w-full bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={onClose}>
              Selesai
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
