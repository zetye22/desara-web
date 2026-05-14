"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export function DashboardRealtime() {
  const router    = useRouter()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  const refresh = useCallback(() => {
    router.refresh()
  }, [router])

  useEffect(() => {
    const supabase = createClient()

    channelRef.current = supabase
      .channel("dashboard-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        (payload) => {
          const b = payload.new as { nama_client?: string }
          toast.success(`Booking baru dari ${b.nama_client ?? "client"}!`, {
            description: "Dashboard diperbarui",
            duration: 5000,
          })
          refresh()
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        () => { refresh() }
      )
      .subscribe()

    // Auto-refresh setiap 5 menit
    const interval = setInterval(refresh, 5 * 60 * 1000)

    return () => {
      channelRef.current?.unsubscribe()
      clearInterval(interval)
    }
  }, [refresh])

  return null
}
