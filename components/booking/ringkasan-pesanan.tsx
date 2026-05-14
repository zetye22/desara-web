"use client"

import { useBookingStore } from "@/lib/booking-store"
import { hitungHarga } from "@/lib/harga-booking"
import { formatRupiah } from "@/lib/utils"
import { SEMUA_PAKET, KATEGORI_LABEL } from "@/lib/constants"
import type { KategoriSesi } from "@/types"
import { ShoppingCart } from "lucide-react"

export function RingkasanPesanan() {
  const { paketId, addons, kategori, katalog } = useBookingStore()
  const rincian = hitungHarga(paketId, addons, katalog)
  const paket = (katalog?.paket ?? SEMUA_PAKET).find((p) => p.id === paketId)

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-4">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="font-bold text-[#0d1f3c] text-sm">Ringkasan Pesanan</h3>
      </div>

      {!paketId ? (
        <p className="text-gray-400 text-sm text-center py-4">
          Pilih paket untuk melihat estimasi harga
        </p>
      ) : (
        <>
          {/* Kategori + Paket */}
          {kategori && (
            <div className="text-xs text-[#C9A84C] font-semibold uppercase tracking-wide mb-1">
              {KATEGORI_LABEL[kategori as KategoriSesi]}
            </div>
          )}

          {/* Baris paket */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <span className="text-sm font-medium text-gray-700">
              Paket {rincian.namaPaket}
            </span>
            <span className="text-sm font-semibold text-gray-800 shrink-0">
              {formatRupiah(rincian.subtotalPaket)}
            </span>
          </div>

          {/* Add-on items */}
          {rincian.addonItems.length > 0 && (
            <div className="border-t border-dashed pt-3 mb-3 space-y-2">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Add-on
              </p>
              {rincian.addonItems.map((item) => (
                <div key={item.nama} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-600">+ {item.nama}</span>
                  <span className="text-xs font-medium text-gray-700 shrink-0">
                    {formatRupiah(item.harga)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Total */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between font-bold">
              <span className="text-gray-800">Total</span>
              <span className="text-[#C9A84C] text-lg">{formatRupiah(rincian.total)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>DP Minimum</span>
              <span>{formatRupiah(rincian.dpMinimum)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Sisa Bayar di Studio</span>
              <span>{formatRupiah(rincian.sisaBayar)}</span>
            </div>
          </div>

          {/* Durasi */}
          {paket && (
            <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
              Durasi sesi:{" "}
              <span className="font-semibold">{rincian.durasiTotal} menit</span>
            </div>
          )}
        </>
      )}
    </aside>
  )
}
