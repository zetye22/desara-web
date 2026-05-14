"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Client } from "./types"
import { formatRupiah } from "@/lib/utils"

interface ExportButtonProps {
  clients: Client[]
  disabled?: boolean
}

export function ExportButton({ clients, disabled }: ExportButtonProps) {
  function handleExport() {
    const headers = [
      "Nama", "No WA", "Email", "Total Booking", "Total Spending",
      "Terakhir Booking", "Tags", "Blacklist", "Catatan", "Bergabung"
    ]

    const rows = clients.map((c) => [
      c.nama,
      c.no_wa,
      c.email ?? "",
      c.total_booking,
      formatRupiah(c.total_spending),
      c.last_booking_date ?? "",
      (c.tags ?? []).join(", "),
      c.is_blacklist ? "Ya" : "Tidak",
      c.catatan ?? "",
      new Date(c.created_at).toLocaleDateString("id-ID"),
    ])

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) =>
          typeof cell === "string" && (cell.includes(",") || cell.includes('"') || cell.includes("\n"))
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        ).join(",")
      )
      .join("\n")

    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clients_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || clients.length === 0}
      className="gap-1.5"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </Button>
  )
}
