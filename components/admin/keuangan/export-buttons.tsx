"use client"

import { useState } from "react"
import { Download, FileText, Table, BarChart2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { LaporanData } from "./types"

// Label kategori sesi
const KATEGORI_LABEL: Record<string, string> = {
  wisuda: "Wisuda",
  prewed: "Prewedding",
  keluarga: "Keluarga",
  group: "Group",
  portrait: "Portrait",
}

// Format label bulan "YYYY-MM" → "Mei 2026"
function labelBulanPanjang(periode: string): string {
  const [year, month] = periode.split("-").map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date)
}

// Format Rupiah
const fmtRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v)

interface ExportButtonsProps {
  data: LaporanData
  periode: string
}

const JENIS_LABEL: Record<string, string> = {
  tambahan_waktu: "Tambahan Waktu",
  tambahan_orang: "Tambahan Orang",
  tambahan_background: "Tambahan Background",
  cetak_12r: "Cetak 12R",
  cetak_20r: "Cetak 20R",
  lainnya: "Lainnya",
}

export function ExportButtons({ data, periode }: ExportButtonsProps) {
  const [loadingPdf, setLoadingPdf] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)
  const [loadingAddon, setLoadingAddon] = useState(false)

  const labelBulan = labelBulanPanjang(periode)
  const tanggalGenerate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date())

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setLoadingPdf(true)
    try {
      const jsPDF = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      let y = 20

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 31, 60)
      doc.text("DESARA HOME STUDIO", pageW / 2, y, { align: "center" })
      y += 7

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(`Laporan Keuangan ${labelBulan}`, pageW / 2, y, { align: "center" })
      y += 10

      // Garis pembatas
      doc.setDrawColor(201, 168, 76)
      doc.setLineWidth(0.5)
      doc.line(14, y, pageW - 14, y)
      y += 8

      // ── Ringkasan KPI ────────────────────────────────────────────────────
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 31, 60)
      doc.text("RINGKASAN KEUANGAN", 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [["Keterangan", "Jumlah"]],
        body: [
          ["Total Pemasukan", fmtRupiah(data.pemasukan.total)],
          ["Total Pengeluaran", fmtRupiah(data.pengeluaran.total)],
          ["Laba Bersih", fmtRupiah(data.laba)],
          ["Margin Profit", `${(data.margin * 100).toFixed(1)}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10

      // ── Rincian Pemasukan ────────────────────────────────────────────────
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(13, 31, 60)
      doc.text("RINCIAN PEMASUKAN", 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [["Sumber", "Total", "% dari Total"]],
        body: [
          ["Pemasukan Paket", fmtRupiah(data.pemasukan.totalPaket), data.pemasukan.total > 0 ? `${((data.pemasukan.totalPaket / data.pemasukan.total) * 100).toFixed(1)}%` : "—"],
          ["Add-on Booking Awal", fmtRupiah(data.pemasukan.addonBookingAwal), data.pemasukan.total > 0 ? `${((data.pemasukan.addonBookingAwal / data.pemasukan.total) * 100).toFixed(1)}%` : "—"],
          ["Add-on Lapangan", fmtRupiah(data.pemasukan.addonLapangan), data.pemasukan.total > 0 ? `${((data.pemasukan.addonLapangan / data.pemasukan.total) * 100).toFixed(1)}%` : "—"],
        ],
        foot: [["Total Pemasukan", fmtRupiah(data.pemasukan.total), "100%"]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 10

      // ── HPP ─────────────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(13, 31, 60)
      doc.text("HPP PER BOOKING", 14, y)
      y += 5

      const hppRows: string[][] = []
      data.pengeluaran.hpp.fotografer.forEach((f) =>
        hppRows.push([`Upah Fotografer ${f.nama}`, `${f.jumlah} booking`, fmtRupiah(f.upahPerClient), fmtRupiah(f.total)])
      )
      data.pengeluaran.hpp.editor.forEach((e) =>
        hppRows.push([`Upah Editor ${e.nama}`, `${e.jumlah} booking`, fmtRupiah(e.upahPerClient), fmtRupiah(e.total)])
      )
      data.pengeluaran.hpp.cetak.forEach((c) =>
        hppRows.push([c.jenis, `${c.jumlah} pcs`, fmtRupiah(c.hargaSatuan), fmtRupiah(c.total)])
      )

      autoTable(doc, {
        startY: y,
        head: [["Item", "Jumlah", "Harga Satuan", "Total"]],
        body: hppRows.length > 0 ? hppRows : [["Tidak ada HPP", "", "", ""]],
        foot: [["Subtotal HPP", "", "", fmtRupiah(data.pengeluaran.totalHpp)]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      y = (doc as any).lastAutoTable.finalY + 8

      // ── Operasional ─────────────────────────────────────────────────────
      doc.setFont("helvetica", "bold")
      doc.text("BIAYA OPERASIONAL", 14, y)
      y += 5

      autoTable(doc, {
        startY: y,
        head: [["Item", "Total"]],
        body: data.pengeluaran.operasional.biayaTetap.map((b) => [b.nama, fmtRupiah(b.nominal)]),
        foot: [["Subtotal Operasional", fmtRupiah(data.pengeluaran.totalOperasional)]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })

      // ── Footer halaman ───────────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Digenerate: ${tanggalGenerate} WIB  |  Halaman ${i} dari ${pageCount}`,
          pageW / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        )
      }

      doc.save(`laporan-${periode}.pdf`)
      toast.success("PDF berhasil diunduh")
    } catch (err) {
      console.error(err)
      toast.error("Gagal menggenerate PDF")
    } finally {
      setLoadingPdf(false)
    }
  }

  // ── Export Excel ───────────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    setLoadingExcel(true)
    try {
      const XLSX = await import("xlsx")

      const wb = XLSX.utils.book_new()

      // Sheet 1: Pemasukan
      const pemasukanData = [
        ["Laporan Pemasukan", labelBulan],
        [],
        ["Sumber", "Total (Rp)", "% dari Total"],
        ["Pemasukan Paket", data.pemasukan.totalPaket, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.totalPaket / data.pemasukan.total) * 100).toFixed(1)) : 0],
        ["Add-on Booking Awal", data.pemasukan.addonBookingAwal, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonBookingAwal / data.pemasukan.total) * 100).toFixed(1)) : 0],
        ["Add-on Lapangan", data.pemasukan.addonLapangan, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonLapangan / data.pemasukan.total) * 100).toFixed(1)) : 0],
        [],
        ["Total Pemasukan", data.pemasukan.total, 100],
        [],
        ["=== DETAIL PER KATEGORI SESI ==="],
        ["Kategori", "Jumlah Booking", "Total Revenue (Rp)", "Rata-rata per Booking (Rp)"],
        ...data.pemasukan.perKategori.map((k) => [
          KATEGORI_LABEL[k.kategori] ?? k.kategori,
          k.jumlah,
          k.total,
          k.rata,
        ]),
      ]
      const wsPemasukan = XLSX.utils.aoa_to_sheet(pemasukanData)
      XLSX.utils.book_append_sheet(wb, wsPemasukan, "Pemasukan")

      // Sheet 2: Pengeluaran
      const pengeluaranData = [
        ["Laporan Pengeluaran", labelBulan],
        [],
        ["=== HPP ==="],
        ["Item", "Jumlah", "Harga Satuan (Rp)", "Total (Rp)"],
        ...data.pengeluaran.hpp.fotografer.map((f) => [
          `Upah Fotografer ${f.nama}`, f.jumlah, f.upahPerClient, f.total,
        ]),
        ...data.pengeluaran.hpp.editor.map((e) => [
          `Upah Editor ${e.nama}`, e.jumlah, e.upahPerClient, e.total,
        ]),
        ...data.pengeluaran.hpp.cetak.map((c) => [
          c.jenis, c.jumlah, c.hargaSatuan, c.total,
        ]),
        ["Subtotal HPP", "", "", data.pengeluaran.totalHpp],
        [],
        ["=== OPERASIONAL ==="],
        ["Item", "Total (Rp)"],
        ...data.pengeluaran.operasional.biayaTetap.map((b) => [b.nama, b.nominal]),
        ["Subtotal Operasional", data.pengeluaran.totalOperasional],
        [],
        ["=== PENGELUARAN LAINNYA ==="],
        ["Tanggal", "Kategori", "Deskripsi", "Nominal (Rp)"],
        ...data.pengeluaran.lainnya.map((p) => [
          p.tanggal, p.kategori, p.deskripsi ?? "", p.nominal,
        ]),
        ["Subtotal Lainnya", "", "", data.pengeluaran.totalLainnya],
        [],
        ["Total Pengeluaran", "", "", data.pengeluaran.total],
      ]
      const wsPengeluaran = XLSX.utils.aoa_to_sheet(pengeluaranData)
      XLSX.utils.book_append_sheet(wb, wsPengeluaran, "Pengeluaran")

      // Sheet 3: Ringkasan
      const ringkasanData = [
        ["Ringkasan Keuangan", labelBulan],
        [],
        ["Keterangan", "Nilai (Rp)"],
        ["Total Pemasukan", data.pemasukan.total],
        ["  - Pemasukan Paket", data.pemasukan.totalPaket],
        ["  - Add-on Booking Awal", data.pemasukan.addonBookingAwal],
        ["  - Add-on Lapangan", data.pemasukan.addonLapangan],
        [],
        ["Total Pengeluaran", data.pengeluaran.total],
        ["  - HPP", data.pengeluaran.totalHpp],
        ["  - Operasional", data.pengeluaran.totalOperasional],
        ["  - Lain-lain", data.pengeluaran.totalLainnya],
        [],
        ["Laba Bersih", data.laba],
        ["Margin Profit (%)", parseFloat((data.margin * 100).toFixed(2))],
        [],
        ["Digenerate", tanggalGenerate],
      ]
      const wsRingkasan = XLSX.utils.aoa_to_sheet(ringkasanData)
      XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan")

      XLSX.writeFile(wb, `laporan-${periode}.xlsx`)
      toast.success("Excel berhasil diunduh")
    } catch (err) {
      console.error(err)
      toast.error("Gagal menggenerate Excel")
    } finally {
      setLoadingExcel(false)
    }
  }

  // ── Export Laporan Add-on (Excel, 3 sheets) ───────────────────────────────
  const handleExportAddon = async () => {
    setLoadingAddon(true)
    try {
      const XLSX = await import("xlsx")
      const wb = XLSX.utils.book_new()

      // Sheet 1: Summary
      const summaryData = [
        ["Laporan Add-on Lapangan", labelBulan],
        [],
        ["Metrik", "Nilai"],
        ["Total Revenue Add-on Lapangan", data.addonInsight.totalRevenueLapangan],
        ["% dari Total Pemasukan", parseFloat((data.addonInsight.pctDariPemasukan * 100).toFixed(2))],
        ["Avg Revenue per Booking Ada Add-on", data.addonInsight.avgPerBookingAdaAddon],
        ["Booking dengan Add-on Lapangan", data.addonInsight.jumlahBookingAdaAddon],
        ["Total Booking", data.addonInsight.totalBooking],
        ["Conversion Rate (%)", data.addonInsight.totalBooking > 0 ? parseFloat(((data.addonInsight.jumlahBookingAdaAddon / data.addonInsight.totalBooking) * 100).toFixed(1)) : 0],
        ["Top Item", data.addonInsight.topItem ?? "—"],
        [],
        ["Perbandingan Sumber Add-on"],
        ["Sumber", "Total (Rp)", "% dari Total Pemasukan"],
        ["Add-on Booking Awal", data.pemasukan.addonBookingAwal, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonBookingAwal / data.pemasukan.total) * 100).toFixed(1)) : 0],
        ["Add-on Lapangan", data.pemasukan.addonLapangan, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonLapangan / data.pemasukan.total) * 100).toFixed(1)) : 0],
        [],
        ["Digenerate", tanggalGenerate],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary")

      // Sheet 2: Detail per Jenis Add-on
      const detailData = [
        ["Detail Add-on Lapangan per Jenis", labelBulan],
        [],
        ["Jenis", "Nama Item", "Jumlah Transaksi", "Total Revenue (Rp)", "% dari Add-on Lapangan"],
        ...data.detailAddonLapangan.map((d) => [
          JENIS_LABEL[d.jenis] ?? d.jenis,
          d.namaItem,
          d.jumlah,
          d.totalRevenue,
          data.addonInsight.totalRevenueLapangan > 0
            ? parseFloat(((d.totalRevenue / data.addonInsight.totalRevenueLapangan) * 100).toFixed(1))
            : 0,
        ]),
        [],
        ["Total", "", data.detailAddonLapangan.reduce((s, d) => s + d.jumlah, 0), data.addonInsight.totalRevenueLapangan, 100],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailData), "Detail per Jenis")

      // Sheet 3: Tren per Bulan (tren6Bulan)
      const trenData = [
        ["Tren Pemasukan & Add-on 6 Bulan"],
        [],
        ["Bulan", "Total Pemasukan (Rp)", "Laba (Rp)"],
        ...data.tren6Bulan.map((t) => [t.label, t.pemasukan, t.laba]),
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trenData), "Tren 6 Bulan")

      XLSX.writeFile(wb, `laporan-addon-${periode}.xlsx`)
      toast.success("Laporan add-on berhasil diunduh")
    } catch (err) {
      console.error(err)
      toast.error("Gagal menggenerate laporan add-on")
    } finally {
      setLoadingAddon(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1">
        <Download className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="font-semibold text-[#0d1f3c] text-sm">Export Laporan</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Download laporan keuangan {labelBulan} sebagai PDF atau Excel
      </p>
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={handleExportPdf}
          disabled={loadingPdf}
          variant="outline"
          className="gap-2 border-[#0d1f3c] text-[#0d1f3c] hover:bg-[#0d1f3c] hover:text-white"
        >
          <FileText className="w-4 h-4" />
          {loadingPdf ? "Generating..." : "Export PDF"}
        </Button>
        <Button
          onClick={handleExportExcel}
          disabled={loadingExcel}
          variant="outline"
          className="gap-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white"
        >
          <Table className="w-4 h-4" />
          {loadingExcel ? "Generating..." : "Export Excel"}
        </Button>
        <Button
          onClick={handleExportAddon}
          disabled={loadingAddon}
          variant="outline"
          className="gap-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white"
        >
          <BarChart2 className="w-4 h-4" />
          {loadingAddon ? "Generating..." : "Export Add-on"}
        </Button>
      </div>
    </div>
  )
}
