"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { Plus, ImageIcon } from "lucide-react"
import { useRole } from "@/lib/role-context"
import { Button } from "@/components/ui/button"
import { PortfolioCard } from "@/components/admin/portfolio/portfolio-card"
import { UploadModal } from "@/components/admin/portfolio/upload-modal"
import { EditModal } from "@/components/admin/portfolio/edit-modal"

interface PortfolioRow {
  id: string
  image_url: string
  thumbnail_url: string | null
  alt_text: string
  kategori: string
  urutan: number
  aktif: boolean
  caption: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

type FilterKategori = "semua" | "wisuda" | "prewed" | "keluarga" | "group" | "portrait"

const FILTER_LIST: { value: FilterKategori; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "wisuda", label: "Wisuda" },
  { value: "prewed", label: "Prewedding" },
  { value: "keluarga", label: "Keluarga" },
  { value: "group", label: "Group" },
  { value: "portrait", label: "Portrait" },
]

// ─── Wrapper sortable untuk setiap card ──────────────────────────
interface SortablePortfolioCardProps {
  item: PortfolioRow
  selected: boolean
  onToggleSelect: () => void
  onToggleAktif: () => void
  onEdit?: () => void
  onDelete?: () => void
}

function SortablePortfolioCard({
  item,
  selected,
  onToggleSelect,
  onToggleAktif,
  onEdit,
  onDelete,
}: SortablePortfolioCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Gabungkan drag listeners dan attributes sebagai dragHandleProps
  const dragHandleProps = {
    ...attributes,
    ...listeners,
  } as React.HTMLAttributes<HTMLButtonElement>

  return (
    <div ref={setNodeRef} style={style}>
      <PortfolioCard
        item={item}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onToggleAktif={onToggleAktif}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={dragHandleProps}
        isDragging={isDragging}
      />
    </div>
  )
}

// ─── Komponen utama ───────────────────────────────────────────────
interface PortfolioGridProps {
  initialItems: PortfolioRow[]
  adminName: string
}

export function PortfolioGrid({ initialItems }: PortfolioGridProps) {
  const { isAdmin } = useRole()
  const [items, setItems] = useState<PortfolioRow[]>(initialItems)
  const [filter, setFilter] = useState<FilterKategori>("semua")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editItem, setEditItem] = useState<PortfolioRow | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [confirmBulkHapus, setConfirmBulkHapus] = useState(false)

  // Item yang ditampilkan berdasarkan filter
  const filteredItems =
    filter === "semua" ? items : items.filter((i) => i.kategori === filter)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setIsDragging(false)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // Update urutan lokal
    const activeIndex = filteredItems.findIndex((i) => i.id === active.id)
    const overIndex = filteredItems.findIndex((i) => i.id === over.id)
    if (activeIndex === -1 || overIndex === -1) return

    // Reorder filteredItems
    const reordered = [...filteredItems]
    const [moved] = reordered.splice(activeIndex, 1)
    reordered.splice(overIndex, 0, moved)

    // Assign urutan baru berdasarkan posisi
    const reorderedWithUrutan = reordered.map((item, idx) => ({
      ...item,
      urutan: idx + 1,
    }))

    // Merge kembali dengan items yang tidak ditampilkan (karena filter)
    if (filter === "semua") {
      setItems(reorderedWithUrutan)
    } else {
      const others = items.filter((i) => i.kategori !== filter)
      setItems([...others, ...reorderedWithUrutan])
    }

    // Kirim ke API
    try {
      const res = await fetch("/api/portfolio/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reorderedWithUrutan.map((i) => ({ id: i.id, urutan: i.urutan })),
        }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan urutan")
    } catch {
      toast.error("Gagal menyimpan urutan, coba lagi")
    }
  }

  // Toggle pilih satu item
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Toggle aktif/non-aktif dengan optimistic UI
  const toggleAktif = useCallback(async (id: string) => {
    const currentItem = items.find((i) => i.id === id)
    if (!currentItem) return

    const newAktif = !currentItem.aktif

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, aktif: newAktif } : i))
    )

    try {
      const res = await fetch(`/api/portfolio/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktif: newAktif }),
      })
      if (!res.ok) throw new Error("Gagal update status")
      toast.success(newAktif ? "Foto diaktifkan" : "Foto dinon-aktifkan")
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, aktif: !newAktif } : i))
      )
      toast.error("Gagal mengubah status foto")
    }
  }, [items])

  // Hapus satu foto
  const handleDelete = useCallback(async (id: string) => {
    const confirmed = window.confirm("Hapus foto ini? Tindakan ini tidak bisa dibatalkan.")
    if (!confirmed) return

    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus foto")
      setItems((prev) => prev.filter((i) => i.id !== id))
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next })
      toast.success("Foto berhasil dihapus")
    } catch {
      toast.error("Gagal menghapus foto")
    }
  }, [])

  // Bulk action
  const handleBulkAction = async (action: "aktifkan" | "nonaktifkan" | "hapus") => {
    if (selectedIds.size === 0) return

    if (action === "hapus") {
      if (!confirmBulkHapus) {
        setConfirmBulkHapus(true)
        return
      }
      setConfirmBulkHapus(false)
    }

    try {
      const res = await fetch("/api/portfolio/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })
      if (!res.ok) throw new Error("Gagal menjalankan aksi")

      if (action === "hapus") {
        setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)))
        toast.success(`${selectedIds.size} foto berhasil dihapus`)
      } else {
        const newAktif = action === "aktifkan"
        setItems((prev) =>
          prev.map((i) => (selectedIds.has(i.id) ? { ...i, aktif: newAktif } : i))
        )
        toast.success(
          action === "aktifkan"
            ? `${selectedIds.size} foto diaktifkan`
            : `${selectedIds.size} foto dinon-aktifkan`
        )
      }
      setSelectedIds(new Set())
    } catch {
      toast.error("Gagal menjalankan aksi")
    }
  }

  // Refresh setelah upload berhasil
  const handleUploadSuccess = async () => {
    try {
      const res = await fetch("/api/portfolio")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } catch {
      // Abaikan error saat refresh
    }
  }

  // Refresh setelah edit berhasil
  const handleEditSuccess = async () => {
    try {
      const res = await fetch("/api/portfolio")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items ?? [])
      }
    } catch {
      // Abaikan error saat refresh
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1f3c]">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length} foto · {items.filter((i) => i.aktif).length} aktif
          </p>
        </div>
        {!isAdmin && (
          <Button
            onClick={() => setShowUploadModal(true)}
            className="rounded-xl bg-[#0d1f3c] hover:bg-[#0d1f3c]/90 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Foto Baru
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_LIST.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setSelectedIds(new Set()); setConfirmBulkHapus(false) }}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              filter === f.value
                ? "bg-[#0d1f3c] text-white shadow-md"
                : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400 hover:text-gray-800"
            }`}
          >
            {f.label}
            {f.value !== "semua" && (
              <span className="ml-1.5 text-xs opacity-60">
                ({items.filter((i) => i.kategori === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid foto dengan DnD */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium">Belum ada foto</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === "semua"
              ? "Klik tombol Upload untuk menambah foto portfolio"
              : `Belum ada foto kategori ${FILTER_LIST.find((f) => f.value === filter)?.label}`}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredItems.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${
                isDragging ? "select-none" : ""
              }`}
            >
              {filteredItems.map((item) => (
                <SortablePortfolioCard
                  key={item.id}
                  item={item}
                  selected={selectedIds.has(item.id)}
                  onToggleSelect={() => toggleSelect(item.id)}
                  onToggleAktif={() => toggleAktif(item.id)}
                  onEdit={isAdmin ? undefined : () => setEditItem(item)}
                  onDelete={isAdmin ? undefined : () => handleDelete(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-[#0d1f3c] text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold mr-1">{selectedIds.size} dipilih</span>
          <button
            onClick={() => handleBulkAction("aktifkan")}
            className="px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium transition-colors"
          >
            Aktifkan
          </button>
          <button
            onClick={() => handleBulkAction("nonaktifkan")}
            className="px-3 py-1.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white text-sm font-medium transition-colors"
          >
            Non-aktifkan
          </button>
          {!confirmBulkHapus ? (
            <button
              onClick={() => handleBulkAction("hapus")}
              className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              Hapus
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-300">Yakin hapus {selectedIds.size} foto?</span>
              <button
                onClick={() => handleBulkAction("hapus")}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setConfirmBulkHapus(false)}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
              >
                Batal
              </button>
            </div>
          )}
          <button
            onClick={() => { setSelectedIds(new Set()); setConfirmBulkHapus(false) }}
            className="ml-1 w-6 h-6 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 text-white transition-colors text-xs"
            aria-label="Batalkan pilihan"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal upload */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Modal edit */}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}
