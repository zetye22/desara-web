"use client"

import { useState } from "react"
import { Eye, EyeOff, MoreVertical, Pencil, Trash2, GripVertical } from "lucide-react"

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

const KATEGORI_WARNA: Record<string, string> = {
  wisuda:   "bg-blue-500",
  prewed:   "bg-pink-500",
  keluarga: "bg-orange-500",
  group:    "bg-purple-500",
  portrait: "bg-teal-500",
  couple:   "bg-rose-500",
  custom:   "bg-gray-500",
}

const KATEGORI_LABEL: Record<string, string> = {
  wisuda:   "Wisuda",
  prewed:   "Prewedding",
  keluarga: "Keluarga",
  group:    "Group",
  portrait: "Portrait",
  couple:   "Couple",
  custom:   "Custom",
}

export interface PortfolioCardProps {
  item: PortfolioRow
  selected: boolean
  onToggleSelect: () => void
  onToggleAktif: () => void
  onEdit?: () => void
  onDelete?: () => void
  // Drag handle props dari dnd-kit (disediakan oleh SortablePortfolioCard di parent)
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
  isDragging?: boolean
}

export function PortfolioCard({
  item,
  selected,
  onToggleSelect,
  onToggleAktif,
  onEdit,
  onDelete,
  dragHandleProps,
  isDragging,
}: PortfolioCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = () => {
    setMenuOpen(false)
    onDelete?.()
  }

  const handleEdit = () => {
    setMenuOpen(false)
    onEdit?.()
  }

  return (
    <div
      className={`relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-200 group ${
        isDragging ? "opacity-50 shadow-2xl ring-2 ring-[#C9A84C]" : "shadow-sm"
      } ${selected ? "ring-2 ring-[#C9A84C]" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false) }}
    >
      {/* Foto */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.image_url}
        alt={item.alt_text}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />

      {/* Overlay gelap saat hover */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isHovered ? "opacity-40" : "opacity-0"
        }`}
      />

      {/* Overlay non-aktif */}
      {!item.aktif && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">
            Non-aktif
          </span>
        </div>
      )}

      {/* Pojok kiri atas: drag handle + badge kategori */}
      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
        {/* Drag handle */}
        <button
          {...dragHandleProps}
          className="w-6 h-6 rounded flex items-center justify-center bg-black/40 hover:bg-black/60 text-white transition-colors cursor-grab active:cursor-grabbing focus:outline-none"
          aria-label="Seret untuk mengubah urutan"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        {/* Badge kategori */}
        <span
          className={`text-white text-[10px] font-bold px-2 py-0.5 rounded-full ${
            KATEGORI_WARNA[item.kategori] ?? "bg-gray-500"
          }`}
        >
          {KATEGORI_LABEL[item.kategori] ?? item.kategori}
        </span>
      </div>

      {/* Pojok kanan atas: toggle aktif + menu */}
      <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
        {/* Toggle aktif */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleAktif() }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            item.aktif
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-500 hover:bg-gray-600 text-white"
          }`}
          aria-label={item.aktif ? "Non-aktifkan foto" : "Aktifkan foto"}
          title={item.aktif ? "Aktif — klik untuk non-aktifkan" : "Non-aktif — klik untuk aktifkan"}
        >
          {item.aktif ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Menu titik tiga — hanya jika ada aksi */}
        {(onEdit || onDelete) && <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v) }}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/60 text-white transition-colors focus:outline-none"
            aria-label="Menu foto"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-8 w-32 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
            </div>
          )}
        </div>}
      </div>

      {/* Pojok kiri bawah: checkbox bulk select */}
      <div className="absolute bottom-2 left-2 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            selected
              ? "bg-[#C9A84C] border-[#C9A84C]"
              : "bg-black/40 border-white/60 hover:border-white"
          }`}
          aria-label={selected ? "Hapus dari pilihan" : "Pilih foto ini"}
          aria-pressed={selected}
        >
          {selected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
