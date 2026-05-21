"use client"

import { formatRupiah } from "@/lib/utils"
import type { TransaksiHarian, PembayaranRow } from "./types"

interface TabelSaldoBerjalanProps {
  saldoBerjalan: TransaksiHarian[]
  saldoAwal: number
  pembayaran: PembayaranRow[]
}

export function TabelSaldoBerjalan({ saldoBerjalan, saldoAwal, pembayaran }: TabelSaldoBerjalanProps) {
  const totalMasuk  = saldoBerjalan.filter((t) => t.tipe === "masuk").reduce((s, t) => s + t.nominal, 0)
  const totalKeluar = saldoBerjalan.filter((t) => t.tipe === "keluar").reduce((s, t) => s + t.nominal, 0)
  const saldoAkhir  = saldoBerjalan.length > 0 ? saldoBerjalan[saldoBerjalan.length - 1].saldo : saldoAwal
  const dpCount     = pembayaran.filter((p) => p.tipe === "dp").length
  const lunasCount  = pembayaran.filter((p) => p.tipe === "pelunasan").length
  const upahCount   = saldoBerjalan.filter((t) => t.tipe === "keluar" && t.kategori === "upah").length
  const tetapCount  = saldoBerjalan.filter((t) => t.tipe === "keluar" && t.kategori === "tetap").length

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Saldo Awal", value: formatRupiah(saldoAwal), color: "text-gray-700" },
          { label: "Total Masuk", value: `+${formatRupiah(totalMasuk)}`, color: "text-emerald-600" },
          { label: "Total Keluar", value: `-${formatRupiah(totalKeluar)}`, color: "text-red-500" },
          { label: "Saldo Akhir", value: formatRupiah(saldoAkhir), color: saldoAkhir < 0 ? "text-red-600" : "text-[#0d1f3c]" },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 font-medium mb-1">{m.label}</p>
            <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Badge ringkasan transaksi */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs bg-blue-50 text-blue-600 font-medium px-3 py-1 rounded-full">{dpCount} Transaksi DP</span>
        <span className="text-xs bg-emerald-50 text-emerald-600 font-medium px-3 py-1 rounded-full">{lunasCount} Pelunasan</span>
        {upahCount > 0 && <span className="text-xs bg-orange-50 text-orange-600 font-medium px-3 py-1 rounded-full">{upahCount} Upah HPP</span>}
        {tetapCount > 0 && <span className="text-xs bg-purple-50 text-purple-600 font-medium px-3 py-1 rounded-full">{tetapCount} Biaya Tetap</span>}
      </div>

      {/* Tabel */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        {saldoBerjalan.length === 0 ? (
          <div className="py-12 text-center text-gray-300 text-sm">
            Belum ada transaksi kas bulan ini
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                <th className="px-5 py-2.5 text-left font-medium">Keterangan</th>
                <th className="px-5 py-2.5 text-right font-medium text-emerald-500">Masuk</th>
                <th className="px-5 py-2.5 text-right font-medium text-red-400">Keluar</th>
                <th className="px-5 py-2.5 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr className="bg-gray-50/50">
                <td className="px-5 py-2.5 text-gray-400 text-xs">—</td>
                <td className="px-5 py-2.5 text-gray-500 font-medium text-xs">Saldo Awal Bulan</td>
                <td colSpan={2} />
                <td className="px-5 py-2.5 text-right font-bold text-gray-600">{formatRupiah(saldoAwal)}</td>
              </tr>
              {saldoBerjalan.map((t, i) => (
                <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(t.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3 text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        t.tipe === "masuk" ? "bg-emerald-400"
                        : t.kategori === "upah" ? "bg-orange-400"
                        : t.kategori === "cetak" ? "bg-yellow-400"
                        : t.kategori === "tetap" ? "bg-purple-400"
                        : "bg-red-400"
                      }`} />
                      <span>{t.keterangan}</span>
                      {t.kode_booking && <span className="text-xs text-gray-400 hidden sm:inline">· {t.kode_booking}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-600">
                    {t.tipe === "masuk" ? formatRupiah(t.nominal) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-red-500">
                    {t.tipe === "keluar" ? formatRupiah(t.nominal) : "—"}
                  </td>
                  <td className={`px-5 py-3 text-right font-bold ${t.saldo < 0 ? "text-red-600" : "text-gray-700"}`}>
                    {formatRupiah(t.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#0d1f3c] text-white">
                <td colSpan={4} className="px-5 py-3.5 font-bold text-sm">Saldo Akhir Bulan</td>
                <td className={`px-5 py-3.5 text-right font-bold text-sm ${saldoAkhir < 0 ? "text-red-300" : ""}`}>
                  {formatRupiah(saldoAkhir)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
