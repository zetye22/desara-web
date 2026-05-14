"use client"

import { Users, Star, Clock, AlertTriangle, UserPlus } from "lucide-react"
import type { Insights } from "./types"

interface InsightsCardsProps {
  insights: Insights
  onFilterInactive: () => void
  onFilterVip: () => void
  onFilterBlacklist: () => void
}

export function InsightsCards({ insights, onFilterInactive, onFilterVip, onFilterBlacklist }: InsightsCardsProps) {
  const cards = [
    {
      label: "Total Client",
      value: insights.totalClients,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      onClick: undefined,
    },
    {
      label: "Client VIP",
      value: insights.vipCount,
      icon: Star,
      color: "text-amber-600",
      bg: "bg-amber-50",
      onClick: onFilterVip,
    },
    {
      label: "Tidak Aktif (6bln)",
      value: insights.inactiveCount,
      icon: Clock,
      color: "text-gray-500",
      bg: "bg-gray-50",
      onClick: onFilterInactive,
    },
    {
      label: "Blacklist",
      value: insights.blacklistCount,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
      onClick: onFilterBlacklist,
    },
    {
      label: "Baru Bulan Ini",
      value: insights.newThisMonth,
      icon: UserPlus,
      color: "text-green-600",
      bg: "bg-green-50",
      onClick: undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c) => (
        <button
          key={c.label}
          onClick={c.onClick}
          disabled={!c.onClick}
          className={`flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-4 text-left
            ${c.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : "cursor-default"}`}
        >
          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
            <c.icon className={`w-4 h-4 ${c.color}`} />
          </div>
          <p className="text-2xl font-bold text-[#0d1f3c] mt-1">{c.value.toLocaleString("id-ID")}</p>
          <p className="text-xs text-gray-500">{c.label}</p>
        </button>
      ))}
    </div>
  )
}
