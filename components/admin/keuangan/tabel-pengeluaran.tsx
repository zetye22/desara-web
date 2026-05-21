"use client"

import { formatRupiah } from "@/lib/utils"
import type { LaporanData, PengeluaranRow } from "./types"

const KATEGORI_LABEL: Record<string, string> = {
  wifi: "Wifi", pdam: "PDAM", ipl: "IPL", listrik: "Listrik",
  cetak: "Cetak", upah: "Upah", lain: "Lain-lain",
}

interface TabelPengeluaranProps {
  data: LaporanData["pengeluaran"]
  periode: string
  onRefresh: () => void
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className={`px-5 py-2.5 border-b border-gray-100 ${color}`}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
    </div>
  )
}

export function TabelPengeluaran({ data }: TabelPengeluaranProps) {
  const isEmpty = data.hpp.fotografer.length === 0 && data.hpp.editor.length === 0 && data.hpp.cetak.length === 0

  return (
    <div className="space-y-4">
      {/* A. HPP */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <SectionHeader label="A. Harga Pokok Produksi (HPP)" color="bg-gray-50" />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-2.5 text-left font-medium">Item</th>
              <th className="px-5 py-2.5 text-right font-medium">Qty</th>
              <th className="px-5 py-2.5 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isEmpty ? (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-gray-300 text-sm">Tidak ada HPP periode ini</td>
              </tr>
            ) : (
              <>
                {data.hpp.fotografer.map((f) => (
                  <tr key={f.nama} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-gray-700">Upah Fotografer <span className="font-medium">{f.nama}</span></td>
                    <td className="px-5 py-3 text-right text-gray-400">{f.jumlah} booking</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(f.total)}</td>
                  </tr>
                ))}
                {data.hpp.editor.map((e) => (
                  <tr key={e.nama} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-gray-700">Upah Editor <span className="font-medium">{e.nama}</span></td>
                    <td className="px-5 py-3 text-right text-gray-400">{e.jumlah} booking</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(e.total)}</td>
                  </tr>
                ))}
                {data.hpp.cetak.map((c) => (
                  <tr key={c.jenis} className="hover:bg-gray-50/60">
                    <td className="px-5 py-3 text-gray-700">{c.jenis}</td>
                    <td className="px-5 py-3 text-right text-gray-400">{c.jumlah} pcs</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(c.total)}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 text-gray-600">
              <td colSpan={2} className="px-5 py-3 font-semibold text-sm">Subtotal HPP</td>
              <td className="px-5 py-3 text-right font-bold text-sm">{formatRupiah(data.totalHpp)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* B. Operasional */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <SectionHeader label="B. Biaya Operasional Tetap" color="bg-gray-50" />
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-50">
            {data.operasional.biayaTetap.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-5 py-8 text-center text-gray-300 text-sm">Tidak ada biaya tetap</td>
              </tr>
            ) : data.operasional.biayaTetap.map((b) => (
              <tr key={b.nama} className="hover:bg-gray-50/60">
                <td className="px-5 py-3 text-gray-700">{b.nama}</td>
                <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(b.nominal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 text-gray-600">
              <td className="px-5 py-3 font-semibold text-sm">Subtotal Operasional</td>
              <td className="px-5 py-3 text-right font-bold text-sm">{formatRupiah(data.totalOperasional)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* C. Pengeluaran Lainnya */}
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <SectionHeader label="C. Pengeluaran Lainnya" color="bg-gray-50" />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
              <th className="px-5 py-2.5 text-left font-medium">Deskripsi</th>
              <th className="px-5 py-2.5 text-left font-medium hidden sm:table-cell">Kategori</th>
              <th className="px-5 py-2.5 text-right font-medium">Nominal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.lainnya.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-300 text-sm">Belum ada pengeluaran lainnya</td>
              </tr>
            ) : data.lainnya.map((p: PengeluaranRow) => (
              <tr key={p.id} className="hover:bg-gray-50/60">
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {new Date(p.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                </td>
                <td className="px-5 py-3 text-gray-700">{p.deskripsi ?? <span className="text-gray-300">—</span>}</td>
                <td className="px-5 py-3 hidden sm:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                    {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                  </span>
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-700">{formatRupiah(p.nominal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 text-gray-600">
              <td colSpan={3} className="px-5 py-3 font-semibold text-sm">Subtotal Lainnya</td>
              <td className="px-5 py-3 text-right font-bold text-sm">{formatRupiah(data.totalLainnya)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Total */}
      <div className="rounded-xl bg-[#0d1f3c] px-5 py-4 flex justify-between items-center">
        <span className="font-bold text-white">Total Pengeluaran</span>
        <span className="font-bold text-xl text-white">{formatRupiah(data.total)}</span>
      </div>
    </div>
  )
}
