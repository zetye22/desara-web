"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Pencil, UserX, UserCheck, Printer, MessageCircle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import type { PegawaiTetap, PegawaiForm } from "./types"
import { DEFAULT_FORM, POSISI_SUGGESTIONS } from "./types"

interface ModalState {
  id: string | null // null = tambah baru
  form: PegawaiForm
}

export function PegawaiClient() {
  const [items, setItems] = useState<PegawaiTetap[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)
  const [saving, setSaving] = useState(false)
  const [slipModal, setSlipModal] = useState<PegawaiTetap | null>(null)
  const [slipBulan, setSlipBulan] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pegawai")
      const data = await res.json()
      if (res.ok) setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openTambah() {
    setModal({ id: null, form: { ...DEFAULT_FORM } })
  }

  function openEdit(p: PegawaiTetap) {
    setModal({
      id: p.id,
      form: {
        nama: p.nama,
        posisi: p.posisi,
        gaji_bulanan: p.gaji_bulanan,
        tanggal_gajian: p.tanggal_gajian,
        no_wa: p.no_wa ?? "",
        no_rekening: p.no_rekening ?? "",
        bank: p.bank ?? "",
        tanggal_mulai: p.tanggal_mulai,
        catatan: p.catatan ?? "",
      },
    })
  }

  async function handleSave() {
    if (!modal) return
    const f = modal.form

    if (!f.nama.trim()) { toast.error("Nama wajib diisi"); return }
    if (!f.posisi.trim()) { toast.error("Posisi wajib diisi"); return }
    if (f.gaji_bulanan <= 0) { toast.error("Gaji harus lebih dari 0"); return }

    // Konfirmasi perubahan gaji
    if (modal.id) {
      const existing = items.find((i) => i.id === modal.id)
      if (existing && existing.gaji_bulanan !== f.gaji_bulanan) {
        const ok = window.confirm(
          `Ubah gaji "${f.nama}" dari ${formatRupiah(existing.gaji_bulanan)} ke ${formatRupiah(f.gaji_bulanan)}?\n\nBerlaku mulai generate bulan depan.`
        )
        if (!ok) return
      }
    }

    setSaving(true)
    try {
      const url = modal.id ? `/api/pegawai/${modal.id}` : "/api/pegawai"
      const method = modal.id ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          no_wa: f.no_wa || null,
          no_rekening: f.no_rekening || null,
          bank: f.bank || null,
          catatan: f.catatan || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal menyimpan"); return }

      toast.success(`Pegawai "${f.nama}" berhasil ${modal.id ? "diupdate" : "ditambahkan"}`)
      setModal(null)
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleAktif(p: PegawaiTetap) {
    const label = p.aktif ? "nonaktifkan" : "aktifkan kembali"
    const ok = window.confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} pegawai "${p.nama}"?`)
    if (!ok) return

    try {
      const res = await fetch(`/api/pegawai/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          p.aktif
            ? { aktif: false, tanggal_berhenti: new Date().toISOString().split("T")[0] }
            : { aktif: true, tanggal_berhenti: null }
        ),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Gagal"); return }
      toast.success(`Pegawai "${p.nama}" berhasil di-${label}`)
      load()
    } catch {
      toast.error("Terjadi kesalahan")
    }
  }

  function handlePrintSlip(p: PegawaiTetap, bulan: string) {
    const [year, month] = bulan.split("-").map(Number)
    const labelBulan = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
      .format(new Date(year, month - 1, 1))

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Slip Gaji - ${p.nama} - ${labelBulan}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 480px; margin: 0 auto; color: #1a1a1a; }
    .header { text-align: center; border-bottom: 3px solid #0d1f3c; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #0d1f3c; font-weight: bold; letter-spacing: 1px; }
    .header h2 { font-size: 14px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
    .header .periode { font-size: 13px; color: #C9A84C; font-weight: bold; margin-top: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; }
    .info-item label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }
    .info-item span { font-size: 13px; color: #1a1a1a; font-weight: 500; }
    .gaji-box { background: #f8f9fa; border: 2px solid #0d1f3c; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .gaji-box .label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .gaji-box .nominal { font-size: 24px; font-weight: bold; color: #0d1f3c; }
    .tanda-terima { border: 1px solid #ddd; border-radius: 8px; padding: 16px; text-align: center; }
    .tanda-terima .title { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 48px; }
    .tanda-terima .ttd { border-top: 1px solid #333; display: inline-block; padding-top: 6px; min-width: 140px; font-size: 12px; }
    .note { margin-top: 16px; font-size: 10px; color: #aaa; text-align: center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>DESARA HOME STUDIO</h1>
    <h2>Slip Gaji Pegawai</h2>
    <div class="periode">${labelBulan}</div>
  </div>

  <div class="info-grid">
    <div class="info-item">
      <label>Nama</label>
      <span>${p.nama}</span>
    </div>
    <div class="info-item">
      <label>Posisi</label>
      <span>${p.posisi}</span>
    </div>
    <div class="info-item">
      <label>Tanggal Gajian</label>
      <span>Tanggal ${p.tanggal_gajian}</span>
    </div>
    ${p.no_rekening ? `
    <div class="info-item">
      <label>No. Rekening</label>
      <span>${p.no_rekening}${p.bank ? ` (${p.bank})` : ""}</span>
    </div>` : ""}
  </div>

  <div class="gaji-box">
    <div class="label">Total Gaji Diterima</div>
    <div class="nominal">${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(p.gaji_bulanan)}</div>
  </div>

  <div class="tanda-terima">
    <div class="title">Tanda Terima Pegawai</div>
    <div class="ttd">${p.nama}</div>
  </div>

  <div class="note">Slip gaji ini digenerate oleh sistem Desara Home Studio</div>

  <script>window.print(); window.onafterprint = () => window.close();</script>
</body>
</html>`

    const win = window.open("", "_blank", "width=600,height=700")
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  function handleWaSlip(p: PegawaiTetap, bulan: string) {
    const [year, month] = bulan.split("-").map(Number)
    const labelBulan = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" })
      .format(new Date(year, month - 1, 1))

    const noWa = (p.no_wa ?? "").replace(/\D/g, "")
    if (!noWa) { toast.error("No WA pegawai belum diisi"); return }

    const pesan = `Halo ${p.nama.split(" ")[0]} 😊\n\nBerikut informasi gaji Anda untuk periode *${labelBulan}*:\n\n• Posisi: ${p.posisi}\n• Gaji Pokok: *${formatRupiah(p.gaji_bulanan)}*\n• Tanggal Gajian: ${p.tanggal_gajian}\n\nTerima kasih atas dedikasi Anda 🙏\n\n_Desara Home Studio_`
    window.open(`https://wa.me/${noWa}?text=${encodeURIComponent(pesan)}`, "_blank")
  }

  const aktif = items.filter((i) => i.aktif)
  const nonaktif = items.filter((i) => !i.aktif)
  const totalGajiBulan = aktif.reduce((s, p) => s + p.gaji_bulanan, 0)

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pegawai Aktif</p>
          <p className="text-2xl font-bold text-[#0d1f3c] mt-1">{aktif.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Gaji/Bulan</p>
          <p className="text-xl font-bold text-[#C9A84C] mt-1">{formatRupiah(totalGajiBulan)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-500">Rata-rata Gaji</p>
          <p className="text-xl font-bold text-[#0d1f3c] mt-1">
            {aktif.length > 0 ? formatRupiah(Math.round(totalGajiBulan / aktif.length)) : "—"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="bg-[#0d1f3c] hover:bg-[#1a3561] gap-1.5"
          onClick={openTambah}
        >
          <Plus className="w-4 h-4" />
          Tambah Pegawai
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={load}
          disabled={loading}
          className="gap-1.5 text-gray-500"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabel pegawai aktif */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
          Memuat data pegawai...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Pegawai Aktif ({aktif.length})
            </p>
          </div>

          {aktif.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              Belum ada pegawai tetap. Klik &ldquo;+ Tambah Pegawai&rdquo; untuk memulai.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Posisi</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Gaji/Bulan</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Tgl Gajian</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {aktif.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {p.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-[#0d1f3c]">{p.nama}</p>
                            <p className="text-xs text-gray-400 sm:hidden">{p.posisi}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-gray-600 hidden sm:table-cell">
                        <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                          {p.posisi}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-[#C9A84C]">
                        {formatRupiah(p.gaji_bulanan)}
                      </td>
                      <td className="px-5 py-3 text-center text-gray-500 hidden md:table-cell">
                        Tgl {p.tanggal_gajian}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSlipModal(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Generate Slip Gaji"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#0d1f3c] hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleAktif(p)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Nonaktifkan"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0d1f3c] text-white">
                    <td className="px-5 py-3 font-semibold" colSpan={2}>Total Gaji Bulanan</td>
                    <td className="px-5 py-3 text-right font-bold">{formatRupiah(totalGajiBulan)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pegawai nonaktif */}
      {nonaktif.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Pegawai Nonaktif ({nonaktif.length})
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {nonaktif.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between opacity-60">
                <div>
                  <p className="text-sm text-gray-600 line-through">{p.nama}</p>
                  <p className="text-xs text-gray-400">{p.posisi} · {formatRupiah(p.gaji_bulanan)}</p>
                  {p.tanggal_berhenti && (
                    <p className="text-xs text-gray-400">
                      Berhenti: {new Date(p.tanggal_berhenti).toLocaleDateString("id-ID")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleToggleAktif(p)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Aktifkan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setModal(null)}>
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1f3c]">
                {modal.id ? "Edit Pegawai" : "Tambah Pegawai Baru"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nama *</label>
                  <input type="text" value={modal.form.nama}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, nama: e.target.value } })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Posisi *</label>
                  <input
                    list="posisi-suggestions"
                    type="text"
                    value={modal.form.posisi}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, posisi: e.target.value } })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                  />
                  <datalist id="posisi-suggestions">
                    {POSISI_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Gaji per Bulan *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">Rp</span>
                    <input
                      type="text"
                      value={modal.form.gaji_bulanan > 0 ? modal.form.gaji_bulanan.toLocaleString("id-ID") : ""}
                      onChange={(e) => {
                        const val = parseInt(e.target.value.replace(/\D/g, "") || "0")
                        setModal({ ...modal, form: { ...modal.form, gaji_bulanan: val } })
                      }}
                      className="w-full rounded-lg border border-gray-200 pl-7 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tanggal Gajian (1–28)</label>
                  <input
                    type="number" min="1" max="28"
                    value={modal.form.tanggal_gajian}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, tanggal_gajian: parseInt(e.target.value) || 1 } })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">No WA</label>
                  <input type="tel" value={modal.form.no_wa}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, no_wa: e.target.value } })}
                    placeholder="628xxx"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tanggal Mulai</label>
                  <input type="date" value={modal.form.tanggal_mulai}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, tanggal_mulai: e.target.value } })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">No Rekening</label>
                  <input type="text" value={modal.form.no_rekening}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, no_rekening: e.target.value } })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Bank</label>
                  <input type="text" value={modal.form.bank}
                    onChange={(e) => setModal({ ...modal, form: { ...modal.form, bank: e.target.value } })}
                    placeholder="BRI, BCA, Mandiri..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catatan</label>
                <textarea value={modal.form.catatan}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, catatan: e.target.value } })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20 resize-none" />
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setModal(null)} disabled={saving}>Batal</Button>
              <Button className="flex-1 bg-[#0d1f3c] hover:bg-[#1a3561]" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Slip Gaji */}
      {slipModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setSlipModal(null)}>
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#0d1f3c]">Slip Gaji — {slipModal.nama}</h2>
              <button onClick={() => setSlipModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">✕</button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Periode</label>
                <input
                  type="month"
                  value={slipBulan}
                  onChange={(e) => setSlipBulan(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
                />
              </div>

              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500">Gaji Pokok</p>
                <p className="text-xl font-bold text-[#C9A84C] mt-0.5">{formatRupiah(slipModal.gaji_bulanan)}</p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={() => handlePrintSlip(slipModal, slipBulan)}
              >
                <Printer className="w-4 h-4" />
                Print / PDF
              </Button>
              {slipModal.no_wa && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-1.5"
                  onClick={() => handleWaSlip(slipModal, slipBulan)}
                >
                  <MessageCircle className="w-4 h-4" />
                  Kirim WA
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
