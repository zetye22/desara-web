import { createAdminClient } from "@/lib/supabase/server"
import { WaitingListClient } from "@/components/admin/waiting-list/waiting-list-client"
import type { WaitingListRow } from "@/components/admin/waiting-list/types"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Waiting List - Desara Home Studio Admin",
}

export default async function AdminWaitingListPage() {
  const supabase = createAdminClient()

  const { data: rows, error } = await supabase
    .from("waiting_list")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching waiting list:", error)
  }

  const items = (rows ?? []) as WaitingListRow[]
  const totalMenunggu = items.filter((i) => i.status === "menunggu").length

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: "#0d1f3c" }}>
            Antrean Waiting List
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar client yang memesan sesi foto dan menunggu kepastian jadwal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#0d1f3c] px-4 py-2 rounded-2xl text-sm font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C9A84C] animate-pulse" />
            <span>{totalMenunggu} antrean menunggu jadwal</span>
          </div>
        </div>
      </div>

      {/* Konten Tabel & Aksi */}
      <WaitingListClient initialItems={items} />
    </div>
  )
}
