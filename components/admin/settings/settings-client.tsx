"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Package, Plus, Image, Settings, CreditCard, History, CalendarX
} from "lucide-react"
import { TabPaket }      from "./tab-paket"
import { TabAddon }      from "./tab-addon"
import { TabBackground } from "./tab-background"
import { TabOperasional } from "./tab-operasional"
import { TabRekening }   from "./tab-rekening"
import { TabRiwayat }    from "./tab-riwayat"
import { TabLibur }      from "./tab-libur"
import type { SettingsRow, Background } from "./types"

const TABS = [
  { id: "paket",       label: "Paket Foto",        icon: Package    },
  { id: "addon",       label: "Add-on",            icon: Plus       },
  { id: "background",  label: "Background",        icon: Image      },
  { id: "operasional", label: "Operasional",       icon: Settings   },
  { id: "rekening",    label: "Rekening & Kontak", icon: CreditCard },
  { id: "libur",       label: "Tgl Libur",         icon: CalendarX  },
  { id: "riwayat",     label: "Riwayat",           icon: History    },
] as const

type TabId = typeof TABS[number]["id"]

interface SettingsClientProps {
  isOwner: boolean
}

export function SettingsClient({ isOwner }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("paket")
  const [allSettings, setAllSettings] = useState<SettingsRow[]>([])
  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loadingSettings, setLoadingSettings] = useState(true)

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true)
    try {
      const res = await fetch("/api/settings")
      const data = await res.json()
      if (res.ok) setAllSettings(data.items ?? [])
    } catch { /* silent */ } finally {
      setLoadingSettings(false)
    }
  }, [])

  const loadBackgrounds = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/background")
      const data = await res.json()
      if (res.ok) setBackgrounds(data.items ?? [])
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    loadSettings()
    loadBackgrounds()
  }, [loadSettings, loadBackgrounds])

  function getByKey(key: string): SettingsRow | undefined {
    return allSettings.find((s) => s.key === key)
  }

  function getByPrefix(prefix: string): SettingsRow[] {
    return allSettings.filter((s) => s.key.startsWith(prefix))
  }

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center text-gray-400">
          <Settings className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Memuat pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar tab navigation (desktop) */}
      <aside className="lg:w-52 shrink-0">
        <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-colors border-l-2 ${
                activeTab === id
                  ? "bg-gray-50 border-[#0d1f3c] text-[#0d1f3c]"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:text-[#0d1f3c]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        {/* Permission info */}
        <div className={`mt-3 rounded-xl px-3 py-2.5 text-xs ${
          isOwner ? "bg-green-50 text-green-700 border border-green-100" : "bg-amber-50 text-amber-700 border border-amber-100"
        }`}>
          {isOwner ? "✓ Login sebagai Owner — akses penuh" : "⚠ Login sebagai Admin — hanya bisa lihat"}
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 min-w-0">
        {/* Mobile tab selector */}
        <div className="lg:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d1f3c]/20"
          >
            {TABS.map(({ id, label }) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        {activeTab === "paket" && (
          <TabPaket
            items={getByPrefix("paket_")}
            isOwner={isOwner}
            onRefresh={loadSettings}
          />
        )}

        {activeTab === "addon" && (
          <TabAddon
            items={getByPrefix("addon_")}
            isOwner={isOwner}
            onRefresh={loadSettings}
          />
        )}

        {activeTab === "background" && (
          <TabBackground
            items={backgrounds}
            isOwner={isOwner}
            onRefresh={loadBackgrounds}
          />
        )}

        {activeTab === "operasional" && (
          <TabOperasional
            item={getByKey("operasional")}
            isOwner={isOwner}
            onRefresh={loadSettings}
          />
        )}

        {activeTab === "rekening" && (
          <TabRekening
            rekening={getByKey("rekening")}
            kontak={getByKey("kontak")}
            isOwner={isOwner}
            onRefresh={loadSettings}
          />
        )}

        {activeTab === "libur" && (
          <TabLibur isOwner={isOwner} />
        )}

        {activeTab === "riwayat" && <TabRiwayat />}
      </main>
    </div>
  )
}
