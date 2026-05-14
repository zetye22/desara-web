"use client"

import { useState, useEffect, useCallback } from "react"
import { Radio, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InsightsCards } from "./insights-cards"
import { ClientFilters } from "./filters"
import { ClientTable } from "./client-table"
import { ClientDetailModal } from "./client-detail-modal"
import { BroadcastModal } from "./broadcast-modal"
import { ExportButton } from "./export-button"
import type { Client, Insights, FilterState } from "./types"
import { DEFAULT_FILTERS } from "./types"

export function ClientsClient() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const [insights, setInsights] = useState<Insights | null>(null)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailClient, setDetailClient] = useState<Client | null>(null)
  const [showBroadcast, setShowBroadcast] = useState(false)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search)         params.set("search", filters.search)
      if (filters.tags.length > 0) params.set("tags", filters.tags.join(","))
      if (filters.bookingMin)     params.set("booking_min", filters.bookingMin)
      if (filters.bookingMax)     params.set("booking_max", filters.bookingMax)
      if (filters.spendingMin)    params.set("spending_min", String(Number(filters.spendingMin) * 1000))
      if (filters.spendingMax)    params.set("spending_max", String(Number(filters.spendingMax) * 1000))
      if (filters.inactiveBulan)  params.set("inactive_bulan", filters.inactiveBulan)
      if (filters.blacklist !== "") params.set("blacklist", filters.blacklist)
      params.set("sort", filters.sort)
      params.set("order", filters.order)
      params.set("page", String(filters.page))
      params.set("limit", "30")

      const res = await fetch(`/api/clients?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setClients(data.items ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchInsights = useCallback(async () => {
    const res = await fetch("/api/clients/insights")
    if (res.ok) {
      const data = await res.json()
      setInsights(data)
    }
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])
  useEffect(() => { fetchInsights() }, [fetchInsights])

  // Reset selected saat filter berubah
  useEffect(() => { setSelectedIds(new Set()) }, [filters])

  function handleSelectId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelectAll() {
    if (clients.every((c) => selectedIds.has(c.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(clients.map((c) => c.id)))
    }
  }

  function handleClientUpdated(updated: Client) {
    setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    setDetailClient(updated)
    fetchInsights()
  }

  const selectedClients = clients.filter((c) => selectedIds.has(c.id))

  return (
    <div className="space-y-4">
      {/* Insights */}
      {insights && (
        <InsightsCards
          insights={insights}
          onFilterVip={() => setFilters({ ...DEFAULT_FILTERS, sort: "total_spending", order: "desc" })}
          onFilterInactive={() => setFilters({ ...DEFAULT_FILTERS, inactiveBulan: "6" })}
          onFilterBlacklist={() => setFilters({ ...DEFAULT_FILTERS, blacklist: "true" })}
        />
      )}

      {/* Filter */}
      <ClientFilters filters={filters} onChange={setFilters} />

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={fetchClients}
          variant="ghost"
          className="gap-1.5 text-gray-500"
          disabled={loading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>

        <div className="flex-1" />

        <ExportButton clients={clients} disabled={loading} />

        {selectedIds.size > 0 && (
          <Button
            size="sm"
            onClick={() => setShowBroadcast(true)}
            className="bg-green-600 hover:bg-green-700 gap-1.5"
          >
            <Radio className="w-4 h-4" />
            Broadcast ({selectedIds.size})
          </Button>
        )}
      </div>

      {/* Tabel */}
      {loading && clients.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center text-gray-400 text-sm">
          Memuat data client...
        </div>
      ) : (
        <ClientTable
          clients={clients}
          total={total}
          page={filters.page}
          totalPages={totalPages}
          selectedIds={selectedIds}
          onSelectId={handleSelectId}
          onSelectAll={handleSelectAll}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          onOpenDetail={setDetailClient}
        />
      )}

      {/* Modal detail */}
      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onUpdated={handleClientUpdated}
        />
      )}

      {/* Broadcast modal */}
      {showBroadcast && (
        <BroadcastModal
          clients={selectedClients}
          onClose={() => { setShowBroadcast(false); setSelectedIds(new Set()) }}
        />
      )}
    </div>
  )
}
