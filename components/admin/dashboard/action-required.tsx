"use client"

import { useState } from "react"
import { Bell, CheckCircle2, Phone, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatTanggal } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ActionItem } from "./types"

const TIPE_CFG = {
  reminder_besok: {
    label:  "Reminder Besok",
    cls:    "bg-blue-50 text-blue-700 border-blue-100",
    dot:    "bg-blue-400",
  },
  foto_siap: {
    label:  "Foto Siap Diambil",
    cls:    "bg-purple-50 text-purple-700 border-purple-100",
    dot:    "bg-purple-400",
  },
  dp_overdue: {
    label:  "DP Belum Masuk",
    cls:    "bg-orange-50 text-orange-700 border-orange-100",
    dot:    "bg-orange-400",
  },
}

export function ActionRequired({ items: initialItems }: { items: ActionItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState<string | null>(null)

  const dismiss = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id))

  const handleKirimWa = (item: ActionItem) => {
    const pesan = item.tipe === "reminder_besok"
      ? `Halo ${item.nama_client} 😊, kami ingin mengingatkan sesi foto Anda besok (${formatTanggal(item.tgl_foto + "T00:00:00")}) pukul ${item.jam_mulai} WIB di Desara Home Studio. Mohon hadir tepat waktu ya! 🙏`
      : item.tipe === "foto_siap"
        ? `Halo ${item.nama_client} 😊, foto Anda dari sesi ${formatTanggal(item.tgl_foto + "T00:00:00")} sudah selesai diedit dan siap diambil! Kapan kira-kira bisa ke studio? 📸`
        : `Halo ${item.nama_client}, kami ingin mengingatkan bahwa DP untuk booking Anda (${item.kode_booking}) belum kami terima. Mohon segera transfer agar sesi dapat dikonfirmasi. Terima kasih 🙏`

    window.open(`https://wa.me/${item.no_wa}?text=${encodeURIComponent(pesan)}`, "_blank")
  }

  const handleTandaiDiambil = async (item: ActionItem) => {
    setLoading(item.id)
    try {
      const res  = await fetch(`/api/bookings/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_sesi: "diambil" }),
      })
      if (res.ok) {
        toast.success(`${item.nama_client} ditandai sudah mengambil foto`)
        dismiss(item.id)
      } else {
        toast.error("Gagal update status")
      }
    } catch {
      toast.error("Gagal koneksi")
    } finally {
      setLoading(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-gray-600">Semua up-to-date! 🎉</p>
        <p className="text-xs text-gray-400 mt-0.5">Tidak ada tindakan yang diperlukan</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <Bell className="w-4 h-4 text-orange-500" />
        <p className="text-sm font-semibold text-gray-700">Action Required</p>
        <span className="ml-auto text-xs font-semibold bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => {
          const cfg = TIPE_CFG[item.tipe]
          const isLoading = loading === item.id
          return (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{item.nama_client}</p>
                  <p className="text-xs text-gray-400">
                    {item.kode_booking} · {formatTanggal(item.tgl_foto + "T00:00:00")} {item.jam_mulai.slice(0, 5)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pl-5">
                {item.tipe === "foto_siap" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleKirimWa(item)}
                      className="text-xs rounded-xl h-8 gap-1.5"
                    >
                      <Phone className="w-3 h-3" /> Kontak Client
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTandaiDiambil(item)}
                      disabled={isLoading}
                      className="text-xs rounded-xl h-8 bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    >
                      {isLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <CheckCircle2 className="w-3 h-3" />
                      }
                      Tandai Diambil
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleKirimWa(item)}
                    className="text-xs rounded-xl h-8 gap-1.5"
                  >
                    <Phone className="w-3 h-3" />
                    {item.tipe === "reminder_besok" ? "Kirim Reminder" : "Kontak Client"}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
