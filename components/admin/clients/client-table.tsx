"use client"

import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"
import { formatRupiah } from "@/lib/utils"
import type { Client } from "./types"
import { getClientBadges } from "./types"

interface ClientTableProps {
  clients: Client[]
  total: number
  page: number
  totalPages: number
  selectedIds: Set<string>
  onSelectId: (id: string) => void
  onSelectAll: () => void
  onPageChange: (p: number) => void
  onOpenDetail: (c: Client) => void
}

export function ClientTable({
  clients,
  total,
  page,
  totalPages,
  selectedIds,
  onSelectId,
  onSelectAll,
  onPageChange,
  onOpenDetail,
}: ClientTableProps) {
  const allSelected = clients.length > 0 && clients.every((c) => selectedIds.has(c.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header count */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total.toLocaleString("id-ID")} client ditemukan
          {selectedIds.size > 0 && (
            <span className="ml-2 font-medium text-[#0d1f3c]">
              · {selectedIds.size} dipilih
            </span>
          )}
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nama</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">No WA</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Booking</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Spending</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Terakhir</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {clients.map((c) => {
              const badges = getClientBadges(c)
              return (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onOpenDetail(c)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(c.id)}
                      onChange={() => onSelectId(c.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {c.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#0d1f3c]">{c.nama}</p>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.no_wa}</td>
                  <td className="px-4 py-3 text-right font-medium">{c.total_booking}x</td>
                  <td className="px-4 py-3 text-right text-[#C9A84C] font-medium">{formatRupiah(c.total_spending)}</td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {c.last_booking_date
                      ? new Date(c.last_booking_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {badges.map((b) => (
                        <span key={b.label} className={`text-xs px-2 py-0.5 rounded-full ${b.color}`}>{b.label}</span>
                      ))}
                      {(c.tags ?? []).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://wa.me/${c.no_wa.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors inline-flex"
                      title="Chat WA"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-100">
        {clients.map((c) => {
          const badges = getClientBadges(c)
          return (
            <div
              key={c.id}
              className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => onOpenDetail(c)}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(c.id)}
                onChange={(e) => { e.stopPropagation(); onSelectId(c.id) }}
                className="rounded flex-shrink-0"
              />
              <div className="w-9 h-9 rounded-full bg-[#0d1f3c] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {c.nama.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#0d1f3c] truncate">{c.nama}</p>
                <p className="text-xs text-gray-400">{c.no_wa} · {c.total_booking}x booking</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {badges.map((b) => (
                    <span key={b.label} className={`text-xs px-1.5 py-0.5 rounded-full ${b.color}`}>{b.label}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-medium text-[#C9A84C]">{formatRupiah(c.total_spending)}</p>
                <p className="text-xs text-gray-400">
                  {c.last_booking_date
                    ? new Date(c.last_booking_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                    : "—"}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {clients.length === 0 && (
        <div className="py-12 text-center text-gray-400">
          <p className="text-sm">Tidak ada client yang cocok dengan filter</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">Halaman {page} dari {totalPages}</p>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => onPageChange(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                    ${p === page ? "bg-[#0d1f3c] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
