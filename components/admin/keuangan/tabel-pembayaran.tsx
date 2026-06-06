"use client"

import { formatRupiah } from "@/lib/utils"
import type { PembayaranRow } from "./types"

interface TabelPembayaranProps {
  pembayaran: PembayaranRow[]
}

function fmtTgl(tgl: string) {
  return new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export function TabelPembayaran({ pembayaran }: TabelPembayaranProps) {
  const dpRows    = pembayaran.filter((p) => p.tipe === "dp")
  const lunasRows = pembayaran.filter((p) => p.tipe === "pelunasan")
  const totalDp    = dpRows.reduce((s, p) => s + p.nominal, 0)
  const totalLunas = lunasRows.reduce((s, p) => s + p.nominal, 0)

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-500 font-medium mb-0.5">Total DP Masuk</p>
          <p className="text-lg font-bold text-blue-700">{formatRupiah(totalDp)}</p>
          <p className="text-xs text-blue-400 mt-0.5">{dpRows.length} transaksi</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          <p className="text-xs text-emerald-500 font-medium mb-0.5">Total Pelunasan</p>
          <p className="text-lg font-bold text-emerald-700">{formatRupiah(totalLunas)}</p>
          <p className="text-xs text-emerald-400 mt-0.5">{lunasRows.length} transaksi</p>
        </div>
        <div className="bg-[#0d1f3c] rounded-xl px-4 py-3">
          <p className="text-xs text-white/50 font-medium mb-0.5">Total Diterima</p>
          <p className="text-lg font-bold text-[#C9A84C]">{formatRupiah(totalDp + totalLunas)}</p>
          <p className="text-xs text-white/30 mt-0.5">{pembayaran.length} transaksi</p>
        </div>
      </div>

      {/* Tabel DP */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">DP Diterima</p>
          <span className="ml-auto text-xs text-blue-600 font-medium">
            {dpRows.length} transaksi · {formatRupiah(totalDp)}
          </span>
        </div>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="bg-blue-50/60 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Tgl Bayar DP</th>
                <th className="px-5 py-2.5 text-left font-medium">Client</th>
                <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Paket</th>
                <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">Tgl Foto</th>
                <th className="px-5 py-2.5 text-right font-medium">Nominal DP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dpRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">
                    Tidak ada DP di periode ini
                  </td>
                </tr>
              ) : dpRows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtTgl(p.tanggal)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-700">{p.nama_client}</p>
                    <p className="text-xs text-gray-400">{p.kode_booking}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell">{p.nama_paket}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell whitespace-nowrap">
                    {fmtTgl(p.tgl_foto)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-blue-700">
                    {formatRupiah(p.nominal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {dpRows.length > 0 && (
              <tfoot>
                <tr className="bg-blue-50/70">
                  <td colSpan={4} className="px-5 py-2.5 text-xs font-semibold text-blue-600">
                    Subtotal DP
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-sm text-blue-700">
                    {formatRupiah(totalDp)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>
      </div>

      {/* Tabel Pelunasan */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pelunasan Diterima</p>
          <span className="ml-auto text-xs text-emerald-600 font-medium">
            {lunasRows.length} transaksi · {formatRupiah(totalLunas)}
          </span>
        </div>
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="bg-emerald-50/60 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Tgl Pelunasan</th>
                <th className="px-5 py-2.5 text-left font-medium">Client</th>
                <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Paket</th>
                <th className="px-5 py-2.5 text-left font-medium hidden md:table-cell">Tgl Foto</th>
                <th className="px-5 py-2.5 text-right font-medium">Sisa Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lunasRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-300 text-sm">
                    Tidak ada pelunasan di periode ini
                  </td>
                </tr>
              ) : lunasRows.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtTgl(p.tanggal)}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-700">{p.nama_client}</p>
                    <p className="text-xs text-gray-400">{p.kode_booking}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs hidden sm:table-cell">{p.nama_paket}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell whitespace-nowrap">
                    {fmtTgl(p.tgl_foto)}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-emerald-700">
                    {formatRupiah(p.nominal)}
                  </td>
                </tr>
              ))}
            </tbody>
            {lunasRows.length > 0 && (
              <tfoot>
                <tr className="bg-emerald-50/70">
                  <td colSpan={4} className="px-5 py-2.5 text-xs font-semibold text-emerald-600">
                    Subtotal Pelunasan
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-sm text-emerald-700">
                    {formatRupiah(totalLunas)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          </div>
        </div>
      </div>
    </div>
  )
}
