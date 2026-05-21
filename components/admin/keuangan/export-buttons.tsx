"use client"

import { useState } from "react"
import { Download, FileText, Table, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { LaporanData } from "./types"

const KATEGORI_LABEL: Record<string, string> = {
  wisuda:   "Wisuda",
  prewed:   "Prewedding",
  keluarga: "Keluarga",
  group:    "Group",
  portrait: "Portrait",
}

const JENIS_LABEL: Record<string, string> = {
  tambahan_waktu:       "Tambahan Waktu",
  tambahan_orang:       "Tambahan Orang",
  tambahan_background:  "Tambahan Background",
  cetak_12r:            "Cetak 12R",
  cetak_20r:            "Cetak 20R",
  lainnya:              "Lainnya",
}

function labelBulanPanjang(periode: string): string {
  const [year, month] = periode.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
}

const fmtRupiah = (v: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v)

const fmtTgl = (tgl: string) =>
  new Date(tgl + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })

function pct(val: number, total: number): string {
  return total > 0 ? `${((val / total) * 100).toFixed(1)}%` : "—"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pdfSection(doc: any, title: string, y: number) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(13, 31, 60)
  doc.text(title, 14, y)
}

interface ExportButtonsProps {
  data: LaporanData
  periode: string
}

export function ExportButtons({ data, periode }: ExportButtonsProps) {
  const [loadingPdf,   setLoadingPdf]   = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)

  const labelBulan      = labelBulanPanjang(periode)
  const tanggalGenerate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  }).format(new Date())

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setLoadingPdf(true)
    try {
      const jsPDF     = (await import("jspdf")).default
      const autoTable = (await import("jspdf-autotable")).default

      const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageW = doc.internal.pageSize.getWidth()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastY = () => (doc as any).lastAutoTable.finalY
      let y = 20

      // ── Header ──
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 31, 60)
      doc.text("DESARA HOME STUDIO", pageW / 2, y, { align: "center" })
      y += 7

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 100)
      doc.text(`Laporan Keuangan — ${labelBulan}`, pageW / 2, y, { align: "center" })
      y += 10

      doc.setDrawColor(201, 168, 76)
      doc.setLineWidth(0.5)
      doc.line(14, y, pageW - 14, y)
      y += 8

      // ── 1. Ringkasan ──
      pdfSection(doc, "1. RINGKASAN KEUANGAN", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Keterangan", "Nilai"]],
        body: [
          ["Total Pemasukan (Accrual)",  fmtRupiah(data.pemasukan.total)],
          ["Total Pengeluaran",           fmtRupiah(data.pengeluaran.total)],
          ["Laba Bersih (Accrual)",       fmtRupiah(data.laba)],
          ["Margin Profit",               `${(data.margin * 100).toFixed(1)}%`],
          ["", ""],
          ["Kas Masuk (Cash Basis)",      fmtRupiah(data.kas.totalMasuk)],
          ["Kas Keluar (Cash Basis)",     fmtRupiah(data.kas.totalKeluar)],
          ["Saldo Akhir Kas",             fmtRupiah(data.kas.saldoAkhir)],
          ["Saldo Setelah Bagi Hasil",    fmtRupiah(data.kas.saldoSetelahBagiHasil)],
        ],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 10

      // ── 2. Rincian Pemasukan ──
      pdfSection(doc, "2. RINCIAN PEMASUKAN", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Sumber", "Total", "% dari Total"]],
        body: [
          ["Pemasukan Paket",     fmtRupiah(data.pemasukan.totalPaket),      pct(data.pemasukan.totalPaket, data.pemasukan.total)],
          ["Add-on Booking Awal", fmtRupiah(data.pemasukan.addonBookingAwal), pct(data.pemasukan.addonBookingAwal, data.pemasukan.total)],
          ["Add-on Lapangan",     fmtRupiah(data.pemasukan.addonLapangan),    pct(data.pemasukan.addonLapangan, data.pemasukan.total)],
          ["", "", ""],
          ...data.pemasukan.perKategori.map((k) => [
            `  └ ${KATEGORI_LABEL[k.kategori] ?? k.kategori} (${k.jumlah} sesi)`,
            fmtRupiah(k.total),
            pct(k.total, data.pemasukan.total),
          ]),
        ],
        foot: [["Total Pemasukan", fmtRupiah(data.pemasukan.total), "100%"]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 10

      // ── 3. HPP ──
      pdfSection(doc, "3. HPP PER BOOKING", y)
      const hppRows: string[][] = [
        ...data.pengeluaran.hpp.fotografer.map((f) => [`Upah Fotografer ${f.nama}`, `${f.jumlah} booking`, fmtRupiah(f.upahPerClient), fmtRupiah(f.total)]),
        ...data.pengeluaran.hpp.editor.map((e) => [`Upah Editor ${e.nama}`, `${e.jumlah} booking`, fmtRupiah(e.upahPerClient), fmtRupiah(e.total)]),
        ...data.pengeluaran.hpp.cetak.map((c) => [c.jenis, `${c.jumlah} pcs`, fmtRupiah(c.hargaSatuan), fmtRupiah(c.total)]),
      ]
      autoTable(doc, {
        startY: y + 5,
        head: [["Item", "Jumlah", "Harga Satuan", "Total"]],
        body: hppRows.length > 0 ? hppRows : [["—", "", "", "Tidak ada HPP"]],
        foot: [["Subtotal HPP", "", "", fmtRupiah(data.pengeluaran.totalHpp)]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 8

      // ── 4. Biaya Tetap ──
      pdfSection(doc, "4. BIAYA TETAP (OPERASIONAL)", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Item", "Nominal"]],
        body: data.pengeluaran.operasional.biayaTetap.length > 0
          ? data.pengeluaran.operasional.biayaTetap.map((b) => [b.nama, fmtRupiah(b.nominal)])
          : [["—", "Tidak ada biaya tetap"]],
        foot: [["Subtotal Biaya Tetap", fmtRupiah(data.pengeluaran.totalOperasional)]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 8

      // ── 5. Pengeluaran Lainnya ──
      pdfSection(doc, "5. PENGELUARAN LAINNYA (MANUAL)", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Tanggal", "Kategori", "Deskripsi", "Nominal"]],
        body: data.pengeluaran.lainnya.length > 0
          ? data.pengeluaran.lainnya.map((p) => [p.tanggal, p.kategori, p.deskripsi ?? "—", fmtRupiah(p.nominal)])
          : [["—", "—", "Tidak ada pengeluaran lainnya", "—"]],
        ...(data.pengeluaran.lainnya.length > 0 ? {
          foot: [["Subtotal", "", "", fmtRupiah(data.pengeluaran.totalLainnya)]],
          footStyles: { fillColor: [240, 240, 240], fontStyle: "bold" },
        } : {}),
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        columnStyles: { 3: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 10

      // ── 6. DP & Pelunasan ──
      const dpRows    = data.pembayaran.filter((p) => p.tipe === "dp")
      const lunasRows = data.pembayaran.filter((p) => p.tipe === "pelunasan")
      const totalDp   = dpRows.reduce((s, p) => s + p.nominal, 0)
      const totalLunas = lunasRows.reduce((s, p) => s + p.nominal, 0)

      pdfSection(doc, "6. DP & PELUNASAN DITERIMA", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Tgl Bayar DP", "Client", "Kode", "Paket", "Tgl Foto", "Nominal DP"]],
        body: dpRows.length > 0
          ? dpRows.map((p) => [fmtTgl(p.tanggal), p.nama_client, p.kode_booking, p.nama_paket, fmtTgl(p.tgl_foto), fmtRupiah(p.nominal)])
          : [["—", "—", "—", "Tidak ada DP", "—", "—"]],
        ...(dpRows.length > 0 ? {
          foot: [["Subtotal DP", "", "", "", "", fmtRupiah(totalDp)]],
          footStyles: { fillColor: [239, 246, 255], fontStyle: "bold" },
        } : {}),
        theme: "grid",
        headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: "bold" },
        columnStyles: { 5: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      })
      y = lastY() + 6

      autoTable(doc, {
        startY: y,
        head: [["Tgl Pelunasan", "Client", "Kode", "Paket", "Tgl Foto", "Sisa Bayar"]],
        body: lunasRows.length > 0
          ? lunasRows.map((p) => [fmtTgl(p.tanggal), p.nama_client, p.kode_booking, p.nama_paket, fmtTgl(p.tgl_foto), fmtRupiah(p.nominal)])
          : [["—", "—", "—", "Tidak ada pelunasan", "—", "—"]],
        ...(lunasRows.length > 0 ? {
          foot: [["Subtotal Pelunasan", "", "", "", "", fmtRupiah(totalLunas)]],
          footStyles: { fillColor: [236, 253, 245], fontStyle: "bold" },
        } : {}),
        theme: "grid",
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: "bold" },
        columnStyles: { 5: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
      })
      y = lastY() + 10

      // ── 7. Arus Kas & Bagi Hasil ──
      const { bagiHasil } = data.kas
      pdfSection(doc, "7. ARUS KAS & BAGI HASIL", y)
      autoTable(doc, {
        startY: y + 5,
        head: [["Keterangan", "Nominal"]],
        body: [
          ["Saldo Awal Bulan",                           fmtRupiah(data.kas.saldoAwal)],
          ["(+) Total Kas Masuk  (DP + Pelunasan)",      fmtRupiah(data.kas.totalMasuk)],
          ["(−) Total Kas Keluar (HPP + Tetap + Manual)", fmtRupiah(data.kas.totalKeluar)],
          ["Saldo Akhir Sebelum Bagi Hasil",             fmtRupiah(data.kas.saldoAkhir)],
          ["", ""],
          [bagiHasil.isRugi ? "Rugi — investor tidak mendapat bagian" : "Laba Bersih (Cash Basis)", fmtRupiah(bagiHasil.laba)],
          [`Bagian Investor (${data.kas.persenInvestor}%)`,   fmtRupiah(bagiHasil.bagianInvestor)],
          [`Bagian Studio (${100 - data.kas.persenInvestor}%)`, fmtRupiah(bagiHasil.bagianStudio)],
        ],
        foot: [["Saldo Kas Studio Setelah Bagi Hasil", fmtRupiah(data.kas.saldoSetelahBagiHasil)]],
        theme: "grid",
        headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [13, 31, 60], textColor: [201, 168, 76], fontStyle: "bold" },
        columnStyles: { 1: { halign: "right" } },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
      })
      y = lastY() + 8

      // Detail arus kas harian
      if (data.saldoBerjalan.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [["Tanggal", "Keterangan", "Masuk", "Keluar", "Saldo"]],
          body: [
            ["—", "Saldo Awal Bulan", "", "", fmtRupiah(data.kas.saldoAwal)],
            ...data.saldoBerjalan.map((t) => [
              fmtTgl(t.tanggal),
              t.keterangan + (t.kode_booking ? ` · ${t.kode_booking}` : ""),
              t.tipe === "masuk"  ? fmtRupiah(t.nominal) : "—",
              t.tipe === "keluar" ? fmtRupiah(t.nominal) : "—",
              fmtRupiah(t.saldo),
            ]),
          ],
          theme: "grid",
          headStyles: { fillColor: [13, 31, 60], textColor: 255, fontStyle: "bold" },
          columnStyles: { 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" } },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 },
        })
      }

      // ── Footer ──
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
      const wb   = XLSX.utils.book_new()

      // Sheet 1: Ringkasan
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Ringkasan Keuangan", labelBulan],
        [],
        ["=== LABA/RUGI (ACCRUAL) ==="],
        ["Keterangan", "Nilai (Rp)"],
        ["Total Pemasukan",               data.pemasukan.total],
        ["  - Pemasukan Paket",            data.pemasukan.totalPaket],
        ["  - Add-on Booking Awal",        data.pemasukan.addonBookingAwal],
        ["  - Add-on Lapangan",            data.pemasukan.addonLapangan],
        [],
        ["Total Pengeluaran",              data.pengeluaran.total],
        ["  - HPP",                        data.pengeluaran.totalHpp],
        ["  - Biaya Tetap",                data.pengeluaran.totalOperasional],
        ["  - Lain-lain",                  data.pengeluaran.totalLainnya],
        [],
        ["Laba Bersih (Accrual)",          data.laba],
        ["Margin Profit (%)",              parseFloat((data.margin * 100).toFixed(2))],
        [],
        ["=== ARUS KAS (CASH BASIS) ==="],
        ["Saldo Awal",                     data.kas.saldoAwal],
        ["Total Kas Masuk",                data.kas.totalMasuk],
        ["Total Kas Keluar",               data.kas.totalKeluar],
        ["Saldo Akhir",                    data.kas.saldoAkhir],
        [],
        ["=== BAGI HASIL ==="],
        ["Laba (Cash Basis)",              data.kas.bagiHasil.laba],
        [`Bagian Investor (${data.kas.persenInvestor}%)`,   data.kas.bagiHasil.bagianInvestor],
        [`Bagian Studio (${100 - data.kas.persenInvestor}%)`, data.kas.bagiHasil.bagianStudio],
        ["Saldo Kas Setelah Bagi Hasil",   data.kas.saldoSetelahBagiHasil],
        [],
        ["Digenerate", tanggalGenerate],
      ]), "Ringkasan")

      // Sheet 2: Pemasukan
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Laporan Pemasukan", labelBulan],
        [],
        ["Sumber", "Total (Rp)", "% dari Total"],
        ["Pemasukan Paket",     data.pemasukan.totalPaket,      data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.totalPaket / data.pemasukan.total) * 100).toFixed(1)) : 0],
        ["Add-on Booking Awal", data.pemasukan.addonBookingAwal, data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonBookingAwal / data.pemasukan.total) * 100).toFixed(1)) : 0],
        ["Add-on Lapangan",     data.pemasukan.addonLapangan,    data.pemasukan.total > 0 ? parseFloat(((data.pemasukan.addonLapangan / data.pemasukan.total) * 100).toFixed(1)) : 0],
        [],
        ["Total Pemasukan",     data.pemasukan.total, 100],
        [],
        ["=== DETAIL PER KATEGORI SESI ==="],
        ["Kategori", "Jumlah Booking", "Total Revenue (Rp)", "Rata-rata per Booking (Rp)"],
        ...data.pemasukan.perKategori.map((k) => [
          KATEGORI_LABEL[k.kategori] ?? k.kategori,
          k.jumlah, k.total, k.rata,
        ]),
      ]), "Pemasukan")

      // Sheet 3: DP & Pelunasan
      const dpRows    = data.pembayaran.filter((p) => p.tipe === "dp")
      const lunasRows = data.pembayaran.filter((p) => p.tipe === "pelunasan")
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["DP & Pelunasan Diterima", labelBulan],
        [],
        ["=== DP DITERIMA ==="],
        ["Tgl Bayar DP", "Nama Client", "Kode Booking", "Paket", "Tgl Foto", "Nominal DP (Rp)"],
        ...dpRows.map((p) => [p.tanggal, p.nama_client, p.kode_booking, p.nama_paket, p.tgl_foto, p.nominal]),
        ["Subtotal DP", "", "", "", "", dpRows.reduce((s, p) => s + p.nominal, 0)],
        [],
        ["=== PELUNASAN DITERIMA ==="],
        ["Tgl Pelunasan", "Nama Client", "Kode Booking", "Paket", "Tgl Foto", "Sisa Bayar (Rp)"],
        ...lunasRows.map((p) => [p.tanggal, p.nama_client, p.kode_booking, p.nama_paket, p.tgl_foto, p.nominal]),
        ["Subtotal Pelunasan", "", "", "", "", lunasRows.reduce((s, p) => s + p.nominal, 0)],
        [],
        ["Total Diterima", "", "", "", "", data.pembayaran.reduce((s, p) => s + p.nominal, 0)],
      ]), "DP & Pelunasan")

      // Sheet 4: Pengeluaran
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Laporan Pengeluaran", labelBulan],
        [],
        ["=== HPP ==="],
        ["Item", "Jumlah", "Harga Satuan (Rp)", "Total (Rp)"],
        ...data.pengeluaran.hpp.fotografer.map((f) => [`Upah Fotografer ${f.nama}`, f.jumlah, f.upahPerClient, f.total]),
        ...data.pengeluaran.hpp.editor.map((e) => [`Upah Editor ${e.nama}`, e.jumlah, e.upahPerClient, e.total]),
        ...data.pengeluaran.hpp.cetak.map((c) => [c.jenis, c.jumlah, c.hargaSatuan, c.total]),
        ["Subtotal HPP", "", "", data.pengeluaran.totalHpp],
        [],
        ["=== BIAYA TETAP (OPERASIONAL) ==="],
        ["Item", "Nominal (Rp)"],
        ...data.pengeluaran.operasional.biayaTetap.map((b) => [b.nama, b.nominal]),
        ["Subtotal Biaya Tetap", data.pengeluaran.totalOperasional],
        [],
        ["=== PENGELUARAN LAINNYA (MANUAL) ==="],
        ["Tanggal", "Kategori", "Deskripsi", "Nominal (Rp)"],
        ...data.pengeluaran.lainnya.map((p) => [p.tanggal, p.kategori, p.deskripsi ?? "", p.nominal]),
        ["Subtotal Lainnya", "", "", data.pengeluaran.totalLainnya],
        [],
        ["TOTAL PENGELUARAN", "", "", data.pengeluaran.total],
      ]), "Pengeluaran")

      // Sheet 5: Arus Kas
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Arus Kas Harian", labelBulan],
        [],
        ["Tanggal", "Keterangan", "Kas Masuk (Rp)", "Kas Keluar (Rp)", "Saldo (Rp)"],
        ["—", "Saldo Awal Bulan", "", "", data.kas.saldoAwal],
        ...data.saldoBerjalan.map((t) => [
          t.tanggal,
          t.keterangan + (t.kode_booking ? ` (${t.kode_booking})` : ""),
          t.tipe === "masuk"  ? t.nominal : "",
          t.tipe === "keluar" ? t.nominal : "",
          t.saldo,
        ]),
        [],
        ["SALDO AKHIR", "", data.kas.totalMasuk, data.kas.totalKeluar, data.kas.saldoAkhir],
        [],
        ["=== BAGI HASIL ==="],
        ["Laba (Cash Basis)",                              data.kas.bagiHasil.laba],
        [`Bagian Investor (${data.kas.persenInvestor}%)`,  data.kas.bagiHasil.bagianInvestor],
        [`Bagian Studio (${100 - data.kas.persenInvestor}%)`, data.kas.bagiHasil.bagianStudio],
        ["Saldo Setelah Bagi Hasil",                       data.kas.saldoSetelahBagiHasil],
      ]), "Arus Kas")

      // Sheet 6: Add-on
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
        ["Laporan Add-on Lapangan", labelBulan],
        [],
        ["Metrik", "Nilai"],
        ["Total Revenue Add-on Lapangan (Rp)",   data.addonInsight.totalRevenueLapangan],
        ["% dari Total Pemasukan",                parseFloat((data.addonInsight.pctDariPemasukan * 100).toFixed(2))],
        ["Avg Revenue per Booking Ada Add-on (Rp)", data.addonInsight.avgPerBookingAdaAddon],
        ["Booking dengan Add-on",                 data.addonInsight.jumlahBookingAdaAddon],
        ["Total Booking",                         data.addonInsight.totalBooking],
        ["Conversion Rate (%)",                   data.addonInsight.totalBooking > 0
          ? parseFloat(((data.addonInsight.jumlahBookingAdaAddon / data.addonInsight.totalBooking) * 100).toFixed(1)) : 0],
        ["Top Item",                              data.addonInsight.topItem ?? "—"],
        [],
        ["=== DETAIL PER JENIS ==="],
        ["Jenis", "Nama Item", "Jumlah Transaksi", "Total Revenue (Rp)"],
        ...data.detailAddonLapangan.map((d) => [JENIS_LABEL[d.jenis] ?? d.jenis, d.namaItem, d.jumlah, d.totalRevenue]),
        [],
        ["=== TREN 6 BULAN ==="],
        ["Bulan", "Total Pemasukan (Rp)", "Total Pengeluaran (Rp)", "Laba (Rp)"],
        ...data.tren6Bulan.map((t) => [t.label, t.pemasukan, t.pengeluaran, t.laba]),
      ]), "Add-on & Tren")

      XLSX.writeFile(wb, `laporan-${periode}.xlsx`)
      toast.success("Excel berhasil diunduh — 6 sheet")
    } catch (err) {
      console.error(err)
      toast.error("Gagal menggenerate Excel")
    } finally {
      setLoadingExcel(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-3 mb-1">
        <Download className="w-4 h-4 text-[#C9A84C]" />
        <h3 className="font-semibold text-[#0d1f3c] text-sm">Export Laporan</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Laporan lengkap {labelBulan} — pemasukan, HPP, DP/pelunasan, arus kas, bagi hasil
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleExportPdf}
          disabled={loadingPdf}
          className="h-9 px-4 border border-[#0d1f3c] text-[#0d1f3c] text-sm rounded-xl font-medium hover:bg-[#0d1f3c] hover:text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {loadingPdf
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <FileText className="w-3.5 h-3.5" />
          }
          {loadingPdf ? "Generating..." : "Export PDF"}
        </button>

        <button
          onClick={handleExportExcel}
          disabled={loadingExcel}
          className="h-9 px-4 border border-emerald-700 text-emerald-700 text-sm rounded-xl font-medium hover:bg-emerald-700 hover:text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          {loadingExcel
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Table className="w-3.5 h-3.5" />
          }
          {loadingExcel ? "Generating..." : "Export Excel (6 Sheet)"}
        </button>
      </div>

      <p className="text-[11px] text-gray-300 mt-3">
        PDF: 7 bagian · Excel: Ringkasan, Pemasukan, DP &amp; Pelunasan, Pengeluaran, Arus Kas, Add-on &amp; Tren
      </p>
    </div>
  )
}
