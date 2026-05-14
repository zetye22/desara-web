"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { LaporanData, PengeluaranRow } from "./types"

const KATEGORI_LABEL: Record<string, string> = {
  wifi: "Wifi",
  pdam: "PDAM",
  ipl: "IPL",
  listrik: "Listrik",
  cetak: "Cetak",
  upah: "Upah",
  lain: "Lain-lain",
}

interface TabelPengeluaranProps {
  data: LaporanData["pengeluaran"]
  periode: string
  onRefresh: () => void
}

export function TabelPengeluaran({ data, periode: _periode, onRefresh: _onRefresh }: TabelPengeluaranProps) {
  const [showGajiDetail, setShowGajiDetail] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden space-y-0">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-[#0d1f3c] text-base">Rincian Pengeluaran</h3>
          <p className="text-xs text-gray-400 mt-0.5">HPP, operasional, dan pengeluaran lainnya</p>
        </div>

        {/* ─── A. HPP per Booking ─────────────────────────────────────────── */}
        <div>
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-xs font-semibold text-[#0d1f3c] uppercase tracking-wide">
              A. HPP per Booking
            </p>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-2.5 text-left font-medium">Item</th>
                  <th className="px-5 py-2.5 text-right font-medium">Jumlah</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.hpp.fotografer.map((f) => (
                  <tr key={f.nama} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">Upah Fotografer {f.nama}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600">{f.jumlah} booking</td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700">{formatRupiah(f.total)}</td>
                  </tr>
                ))}
                {data.hpp.editor.map((e) => (
                  <tr key={e.nama} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">Upah Editor {e.nama}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600">{e.jumlah} booking</td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700">{formatRupiah(e.total)}</td>
                  </tr>
                ))}
                {data.hpp.cetak.map((c) => (
                  <tr key={c.jenis} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">{c.jenis}</td>
                    <td className="px-5 py-2.5 text-right text-gray-600">{c.jumlah} pcs</td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700">{formatRupiah(c.total)}</td>
                  </tr>
                ))}
                {data.hpp.fotografer.length === 0 && data.hpp.editor.length === 0 && data.hpp.cetak.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-4 text-center text-gray-400 text-sm">
                      Tidak ada HPP bulan ini
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-semibold text-[#0d1f3c]">
                  <td colSpan={2} className="px-5 py-3">Subtotal HPP</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(data.totalHpp)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile HPP */}
          <div className="sm:hidden divide-y divide-gray-100">
            {data.hpp.fotografer.map((f) => (
              <div key={f.nama} className="px-5 py-3 flex justify-between">
                <span className="text-sm text-gray-700">Fotografer {f.nama} <span className="text-xs text-gray-400">({f.jumlah} booking)</span></span>
                <span className="text-sm font-medium">{formatRupiah(f.total)}</span>
              </div>
            ))}
            {data.hpp.editor.map((e) => (
              <div key={e.nama} className="px-5 py-3 flex justify-between">
                <span className="text-sm text-gray-700">Editor {e.nama} <span className="text-xs text-gray-400">({e.jumlah} booking)</span></span>
                <span className="text-sm font-medium">{formatRupiah(e.total)}</span>
              </div>
            ))}
            {data.hpp.cetak.map((c) => (
              <div key={c.jenis} className="px-5 py-3 flex justify-between">
                <span className="text-sm text-gray-700">{c.jenis} <span className="text-xs text-gray-400">({c.jumlah} pcs)</span></span>
                <span className="text-sm font-medium">{formatRupiah(c.total)}</span>
              </div>
            ))}
            <div className="px-5 py-3 bg-blue-50 flex justify-between font-semibold text-[#0d1f3c]">
              <span>Subtotal HPP</span>
              <span>{formatRupiah(data.totalHpp)}</span>
            </div>
          </div>
        </div>

        {/* ─── B. Gaji Pegawai Tetap ───────────────────────────────────────── */}
        <div>
          <div className="px-5 py-3 bg-indigo-50 border-y border-indigo-100 flex items-center justify-between">
            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
              B. Gaji Pegawai Tetap
            </p>
            {data.gajiPegawaiTetap.items.length > 0 && (
              <button
                onClick={() => setShowGajiDetail(!showGajiDetail)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                {showGajiDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showGajiDetail ? "Sembunyikan" : "Detail"}
              </button>
            )}
          </div>

          {data.gajiPegawaiTetap.items.length === 0 ? (
            <div className="px-5 py-4 text-sm text-gray-400 text-center">
              Belum ada gaji di-generate bulan ini.{" "}
              <a href="/admin/pengeluaran" className="text-indigo-600 hover:underline">Generate dari Pengeluaran</a>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  {showGajiDetail && (
                    <>
                      <thead>
                        <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                          <th className="px-5 py-2.5 text-left font-medium">Pegawai</th>
                          <th className="px-5 py-2.5 text-right font-medium">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.gajiPegawaiTetap.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-5 py-2.5 text-gray-700">{item.deskripsi}</td>
                            <td className="px-5 py-2.5 text-right font-medium text-gray-700">{formatRupiah(item.nominal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </>
                  )}
                  <tfoot>
                    <tr className="bg-indigo-50 font-semibold text-indigo-700">
                      <td className="px-5 py-3">
                        Subtotal Gaji
                        {!showGajiDetail && (
                          <span className="font-normal text-indigo-500 ml-1">
                            ({data.gajiPegawaiTetap.items.length} pegawai)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">{formatRupiah(data.gajiPegawaiTetap.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Mobile */}
              <div className="sm:hidden divide-y divide-gray-100">
                {showGajiDetail && data.gajiPegawaiTetap.items.map((item, i) => (
                  <div key={i} className="px-5 py-3 flex justify-between">
                    <span className="text-sm text-gray-700">{item.deskripsi}</span>
                    <span className="text-sm font-medium">{formatRupiah(item.nominal)}</span>
                  </div>
                ))}
                <div className="px-5 py-3 bg-indigo-50 flex justify-between font-semibold text-indigo-700">
                  <span>Subtotal Gaji ({data.gajiPegawaiTetap.items.length} pegawai)</span>
                  <span>{formatRupiah(data.gajiPegawaiTetap.total)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── C. Biaya Operasional ────────────────────────────────────────── */}
        <div>
          <div className="px-5 py-3 bg-orange-50 border-y border-orange-100">
            <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">
              C. Biaya Operasional
            </p>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-2.5 text-left font-medium">Item</th>
                  <th className="px-5 py-2.5 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.operasional.biayaTetap.map((b) => (
                  <tr key={b.nama} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">{b.nama}</td>
                    <td className="px-5 py-2.5 text-right font-medium text-gray-700">
                      {formatRupiah(b.nominal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-orange-50 font-semibold text-orange-700">
                  <td className="px-5 py-3">Subtotal Operasional</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(data.totalOperasional)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Operasional */}
          <div className="sm:hidden divide-y divide-gray-100">
            {data.operasional.biayaTetap.map((b) => (
              <div key={b.nama} className="px-5 py-3 flex justify-between">
                <span className="text-sm text-gray-700">{b.nama}</span>
                <span className="text-sm font-medium">{formatRupiah(b.nominal)}</span>
              </div>
            ))}
            <div className="px-5 py-3 bg-orange-50 flex justify-between font-semibold text-orange-700">
              <span>Subtotal Operasional</span>
              <span>{formatRupiah(data.totalOperasional)}</span>
            </div>
          </div>
        </div>

        {/* ─── D. Pengeluaran Lain ─────────────────────────────────────────── */}
        <div>
          <div className="px-5 py-3 bg-gray-50 border-y border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              D. Pengeluaran Lainnya
            </p>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs uppercase">
                  <th className="px-5 py-2.5 text-left font-medium">Tanggal</th>
                  <th className="px-5 py-2.5 text-left font-medium">Kategori</th>
                  <th className="px-5 py-2.5 text-left font-medium">Deskripsi</th>
                  <th className="px-5 py-2.5 text-right font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.lainnya.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-gray-400 text-sm">
                      Belum ada pengeluaran lainnya bulan ini
                    </td>
                  </tr>
                ) : (
                  data.lainnya.map((p: PengeluaranRow) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 text-gray-600 whitespace-nowrap">
                        {new Date(p.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-2.5">
                        <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-600">
                        {p.deskripsi ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-2.5 text-right font-medium text-gray-700">
                        {formatRupiah(p.nominal)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold text-gray-700">
                  <td colSpan={3} className="px-5 py-3">Subtotal Lainnya</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(data.totalLainnya)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile Lainnya */}
          <div className="sm:hidden divide-y divide-gray-100">
            {data.lainnya.length === 0 ? (
              <div className="px-5 py-6 text-center text-gray-400 text-sm">
                Belum ada pengeluaran lainnya
              </div>
            ) : (
              data.lainnya.map((p: PengeluaranRow) => (
                <div key={p.id} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(p.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    {p.deskripsi && (
                      <p className="text-sm text-gray-600 truncate">{p.deskripsi}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 shrink-0">
                    {formatRupiah(p.nominal)}
                  </span>
                </div>
              ))
            )}
            <div className="px-5 py-3 bg-gray-100 flex justify-between font-semibold text-gray-700">
              <span>Subtotal Lainnya</span>
              <span>{formatRupiah(data.totalLainnya)}</span>
            </div>
          </div>
        </div>

        {/* ─── Footer Total Keseluruhan ──────────────────────────────────── */}
        <div className="px-5 py-4 bg-[#0d1f3c] text-white flex justify-between items-center">
          <span className="font-bold text-base">Total Pengeluaran</span>
          <span className="font-bold text-xl">{formatRupiah(data.total)}</span>
        </div>
      </div>

    </>
  )
}
