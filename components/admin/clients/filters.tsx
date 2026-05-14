"use client"

import { Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { FilterState } from "./types"
import { AVAILABLE_TAGS, DEFAULT_FILTERS } from "./types"

interface FiltersProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export function ClientFilters({ filters, onChange }: FiltersProps) {
  const [expanded, setExpanded] = useState(false)

  function set<K extends keyof FilterState>(key: K, val: FilterState[K]) {
    onChange({ ...filters, [key]: val, page: 1 })
  }

  function reset() {
    onChange({ ...DEFAULT_FILTERS })
  }

  const hasActiveFilter =
    filters.search ||
    filters.tags.length > 0 ||
    filters.bookingMin ||
    filters.bookingMax ||
    filters.spendingMin ||
    filters.spendingMax ||
    filters.inactiveBulan ||
    filters.blacklist !== ""

  function toggleTag(tag: string) {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    set("tags", next)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Baris 1: Search + tombol expand */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor WA..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
          />
          {filters.search && (
            <button onClick={() => set("search", "")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Filter
          {hasActiveFilter && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2">
            Reset
          </Button>
        )}
      </div>

      {/* Filter lanjutan */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          {/* Tags */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Tag</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                    ${filters.tags.includes(tag)
                      ? "bg-[#0d1f3c] text-white border-[#0d1f3c]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#0d1f3c]/40"}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Booking range */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Booking Min</p>
              <input type="number" min="0" value={filters.bookingMin}
                onChange={(e) => set("bookingMin", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Booking Max</p>
              <input type="number" min="0" value={filters.bookingMax}
                onChange={(e) => set("bookingMax", e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
            </div>
            {/* Spending range */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Spending Min (rb)</p>
              <input type="number" min="0" value={filters.spendingMin}
                onChange={(e) => set("spendingMin", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Spending Max (rb)</p>
              <input type="number" min="0" value={filters.spendingMax}
                onChange={(e) => set("spendingMax", e.target.value)}
                placeholder="∞"
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Inactive bulan */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Tidak Aktif (bulan)</p>
              <input type="number" min="0" value={filters.inactiveBulan}
                onChange={(e) => set("inactiveBulan", e.target.value)}
                placeholder="misal: 6"
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20" />
            </div>
            {/* Blacklist */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Status Blacklist</p>
              <select value={filters.blacklist}
                onChange={(e) => set("blacklist", e.target.value as FilterState["blacklist"])}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20">
                <option value="">Semua</option>
                <option value="false">Aktif saja</option>
                <option value="true">Blacklist saja</option>
              </select>
            </div>
            {/* Sort */}
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Urutkan</p>
              <select
                value={`${filters.sort}:${filters.order}`}
                onChange={(e) => {
                  const [s, o] = e.target.value.split(":")
                  onChange({ ...filters, sort: s, order: o as "asc" | "desc", page: 1 })
                }}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20">
                <option value="last_booking_date:desc">Booking Terbaru</option>
                <option value="last_booking_date:asc">Booking Terlama</option>
                <option value="total_booking:desc">Terbanyak Booking</option>
                <option value="total_spending:desc">Tertinggi Spending</option>
                <option value="created_at:desc">Client Terbaru</option>
                <option value="nama:asc">Nama A–Z</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
