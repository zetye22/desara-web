"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Save, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"

interface StaffItem {
  id: string
  nama: string
  role: string
  upah_per_client: number
}

interface SlotState {
  staffId:    string  // UUID, "custom", atau "" (tidak ada)
  upah:       number
  customNama: string
}

interface BookingStaff {
  id:                 string
  photographer_1_id?: string | null
  photographer_2_id?: string | null
  editor_id?:         string | null
  upah_pg1?:          number
  upah_pg2?:          number
  upah_editor?:       number
  pg1?:               { id: string; nama: string } | null
  pg2?:               { id: string; nama: string } | null
  ed?:                { id: string; nama: string } | null
}

interface TabStaffProps {
  booking:   BookingStaff
  onSuccess: () => void
}

function emptySlot(): SlotState {
  return { staffId: "", upah: 0, customNama: "" }
}

function initSlot(
  staffId:   string | null | undefined,
  upah:      number | undefined,
  staffList: StaffItem[],
  resolved?: { id: string; nama: string } | null
): SlotState {
  if (!staffId) return emptySlot()
  const match = staffList.find((s) => s.id === staffId)
  if (match) return { staffId, upah: upah ?? match.upah_per_client, customNama: "" }
  // ID ada tapi tidak di list → custom / staff dihapus
  return { staffId: "custom", upah: upah ?? 0, customNama: resolved?.nama ?? "" }
}

// Komponen satu baris slot staff
function StaffSlot({
  label,
  staffList,
  value,
  onChange,
}: {
  label:     string
  staffList: StaffItem[]
  value:     SlotState
  onChange:  (s: SlotState) => void
}) {
  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === "") {
      onChange({ staffId: "", upah: 0, customNama: "" })
    } else if (val === "custom") {
      onChange({ ...value, staffId: "custom", customNama: "" })
    } else {
      const staff = staffList.find((s) => s.id === val)
      onChange({ staffId: val, upah: staff?.upah_per_client ?? 0, customNama: "" })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Label */}
        <span className="text-sm font-semibold text-gray-700 w-14 shrink-0">{label}</span>

        {/* Dropdown staff */}
        <select
          value={value.staffId}
          onChange={handleSelect}
          className="flex-1 min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
        >
          <option value="">— Tidak ada —</option>
          {staffList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
          <option value="custom">Custom (ketik nama)</option>
        </select>

        {/* Input fee */}
        {value.staffId !== "" && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">Rp</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={value.upah}
              onChange={(e) => onChange({ ...value, upah: Number(e.target.value) })}
              className="w-28 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/40"
            />
          </div>
        )}
      </div>

      {/* Input nama custom */}
      {value.staffId === "custom" && (
        <div className="ml-[68px]">
          <input
            type="text"
            placeholder="Ketik nama staff..."
            value={value.customNama}
            onChange={(e) => onChange({ ...value, customNama: e.target.value })}
            className="w-full max-w-xs rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 placeholder:text-amber-300"
          />
        </div>
      )}

      {/* Preview upah */}
      {value.staffId !== "" && value.upah > 0 && (
        <p className="ml-[68px] text-xs text-gray-400">
          Fee: <span className="font-medium text-green-700">{formatRupiah(value.upah)}</span>
        </p>
      )}
    </div>
  )
}

export default function TabStaff({ booking, onSuccess }: TabStaffProps) {
  const [photographers, setPhotographers] = useState<StaffItem[]>([])
  const [editors,       setEditors]       = useState<StaffItem[]>([])
  const [loadingStaff,  setLoadingStaff]  = useState(true)
  const [initialized,   setInitialized]   = useState(false)

  const [pg1,   setPg1]   = useState<SlotState>(emptySlot)
  const [pg2,   setPg2]   = useState<SlotState>(emptySlot)
  const [ed,    setEd]    = useState<SlotState>(emptySlot)
  const [saving, setSaving] = useState(false)

  // Ambil daftar staff dari API
  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => {
        setPhotographers(data.photographers ?? [])
        setEditors(data.editors ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingStaff(false))
  }, [])

  // Inisialisasi form setelah staff list ready
  useEffect(() => {
    if (loadingStaff || initialized) return
    setPg1(initSlot(booking.photographer_1_id, booking.upah_pg1, photographers, booking.pg1))
    setPg2(initSlot(booking.photographer_2_id, booking.upah_pg2, photographers, booking.pg2))
    setEd (initSlot(booking.editor_id,         booking.upah_editor, editors,     booking.ed))
    setInitialized(true)
  }, [loadingStaff, initialized, booking, photographers, editors])

  // Reset saat booking berganti
  useEffect(() => {
    setInitialized(false)
  }, [booking.id])

  const totalFee =
    (pg1.staffId !== "" ? pg1.upah : 0) +
    (pg2.staffId !== "" ? pg2.upah : 0) +
    (ed.staffId  !== "" ? ed.upah  : 0)

  const handleSave = async () => {
    // Validasi custom: nama harus diisi
    if (pg1.staffId === "custom" && !pg1.customNama.trim()) {
      toast.error("Isi nama staff PG 1 terlebih dahulu")
      return
    }
    if (pg2.staffId === "custom" && !pg2.customNama.trim()) {
      toast.error("Isi nama staff PG 2 terlebih dahulu")
      return
    }
    if (ed.staffId === "custom" && !ed.customNama.trim()) {
      toast.error("Isi nama Editor terlebih dahulu")
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        pg1_staff_id:    pg1.staffId !== "" && pg1.staffId !== "custom" ? pg1.staffId    : null,
        pg2_staff_id:    pg2.staffId !== "" && pg2.staffId !== "custom" ? pg2.staffId    : null,
        editor_staff_id: ed.staffId  !== "" && ed.staffId  !== "custom" ? ed.staffId     : null,
        upah_pg1:    pg1.upah,
        upah_pg2:    pg2.upah,
        upah_editor: ed.upah,
      }
      if (pg1.staffId === "custom") body.pg1_custom_nama    = pg1.customNama.trim()
      if (pg2.staffId === "custom") body.pg2_custom_nama    = pg2.customNama.trim()
      if (ed.staffId  === "custom") body.editor_custom_nama = ed.customNama.trim()

      const res  = await fetch(`/api/bookings/${booking.id}/staff`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { success?: boolean; error?: string; pg1_id?: string; pg2_id?: string; editor_id?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan penugasan")
        return
      }

      // Setelah custom berhasil disimpan, update staffId ke UUID yang diterima
      if (data.pg1_id    && pg1.staffId === "custom") setPg1((p) => ({ ...p, staffId: data.pg1_id!    }))
      if (data.pg2_id    && pg2.staffId === "custom") setPg2((p) => ({ ...p, staffId: data.pg2_id!    }))
      if (data.editor_id && ed.staffId  === "custom") setEd ((p) => ({ ...p, staffId: data.editor_id! }))

      toast.success("Penugasan staff berhasil disimpan!")
      onSuccess()
    } catch {
      toast.error("Terjadi kesalahan koneksi")
    } finally {
      setSaving(false)
    }
  }

  if (loadingStaff) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat daftar staff…
      </div>
    )
  }

  return (
    <div className="p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-[#0d1f3c]" />
        <p className="text-sm font-semibold text-gray-700">Penugasan Staff</p>
      </div>

      {/* Form slot */}
      <div className="space-y-5">
        <StaffSlot label="PG 1"   staffList={photographers} value={pg1} onChange={setPg1} />
        <StaffSlot label="PG 2"   staffList={photographers} value={pg2} onChange={setPg2} />
        <StaffSlot label="Editor" staffList={editors}       value={ed}  onChange={setEd}  />
      </div>

      {/* Total fee */}
      {totalFee > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex justify-between items-center text-sm">
          <span className="text-gray-500">Total Fee Staff</span>
          <span className="font-bold text-[#0d1f3c]">{formatRupiah(totalFee)}</span>
        </div>
      )}

      {/* Simpan */}
      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full text-white font-semibold"
        style={{ backgroundColor: "#0d1f3c" }}
      >
        {saving ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan…</>
        ) : (
          <><Save className="w-4 h-4 mr-2" />Simpan Penugasan</>
        )}
      </Button>

      {/* Info laporan */}
      <p className="text-xs text-gray-400 text-center">
        Data ini tercatat otomatis sebagai HPP di laporan keuangan
      </p>
    </div>
  )
}
