"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, Save, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"

interface StaffItem {
  id: string
  nama: string
  upah_per_client: number
}

interface SlotState {
  staffId: string
  upah:    number
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
  return { staffId: "", upah: 0 }
}

function initSlot(
  staffId:   string | null | undefined,
  upah:      number | undefined,
  staffList: StaffItem[],
): SlotState {
  if (!staffId) return emptySlot()
  const match = staffList.find((s) => s.id === staffId)
  return { staffId, upah: upah ?? match?.upah_per_client ?? 0 }
}

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
      onChange(emptySlot())
    } else {
      const staff = staffList.find((s) => s.id === val)
      onChange({ staffId: val, upah: staff?.upah_per_client ?? 0 })
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-semibold text-gray-700 w-14 shrink-0">{label}</span>

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
        </select>

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

      {value.staffId !== "" && value.upah > 0 && (
        <p className="ml-[68px] text-xs text-gray-400">
          Fee: <span className="font-medium text-green-700">{formatRupiah(value.upah)}</span>
        </p>
      )}
    </div>
  )
}

export default function TabStaff({ booking, onSuccess }: TabStaffProps) {
  const [staffList,    setStaffList]    = useState<StaffItem[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [initialized,  setInitialized]  = useState(false)

  const [pg1,    setPg1]    = useState<SlotState>(emptySlot)
  const [pg2,    setPg2]    = useState<SlotState>(emptySlot)
  const [ed,     setEd]     = useState<SlotState>(emptySlot)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => {
        setStaffList(data.all ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingStaff(false))
  }, [])

  useEffect(() => {
    if (loadingStaff || initialized) return
    setPg1(initSlot(booking.photographer_1_id, booking.upah_pg1, staffList))
    setPg2(initSlot(booking.photographer_2_id, booking.upah_pg2, staffList))
    setEd (initSlot(booking.editor_id,         booking.upah_editor, staffList))
    setInitialized(true)
  }, [loadingStaff, initialized, booking, staffList])

  useEffect(() => { setInitialized(false) }, [booking.id])

  const totalFee =
    (pg1.staffId !== "" ? pg1.upah : 0) +
    (pg2.staffId !== "" ? pg2.upah : 0) +
    (ed.staffId  !== "" ? ed.upah  : 0)

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        pg1_staff_id:    pg1.staffId || null,
        pg2_staff_id:    pg2.staffId || null,
        editor_staff_id: ed.staffId  || null,
        upah_pg1:    pg1.upah,
        upah_pg2:    pg2.upah,
        upah_editor: ed.upah,
      }

      const res  = await fetch(`/api/bookings/${booking.id}/staff`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json() as { success?: boolean; error?: string }

      if (!res.ok) {
        toast.error(data.error ?? "Gagal menyimpan penugasan")
        return
      }

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
      <div className="flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-[#0d1f3c]" />
        <p className="text-sm font-semibold text-gray-700">Penugasan Staff</p>
      </div>

      <div className="space-y-5">
        <StaffSlot label="PG 1"   staffList={staffList} value={pg1} onChange={setPg1} />
        <StaffSlot label="PG 2"   staffList={staffList} value={pg2} onChange={setPg2} />
        <StaffSlot label="Editor" staffList={staffList} value={ed}  onChange={setEd}  />
      </div>

      {totalFee > 0 && (
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex justify-between items-center text-sm">
          <span className="text-gray-500">Total Fee Staff</span>
          <span className="font-bold text-[#0d1f3c]">{formatRupiah(totalFee)}</span>
        </div>
      )}

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

      <p className="text-xs text-gray-400 text-center">
        Data ini tercatat otomatis sebagai HPP di laporan keuangan
      </p>
    </div>
  )
}
