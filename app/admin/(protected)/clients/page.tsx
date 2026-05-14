import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ClientsClient } from "@/components/admin/clients/clients-client"

export const metadata: Metadata = {
  title: "Database Client — Desara Studio Admin",
}

export default async function ClientsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Database Client</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola data client, pantau riwayat booking, dan kirim broadcast WhatsApp.
        </p>
      </div>

      <ClientsClient />
    </div>
  )
}
