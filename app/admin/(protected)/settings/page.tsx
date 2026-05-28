import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { SettingsClient } from "@/components/admin/settings/settings-client"

export const metadata: Metadata = {
  title: "Pengaturan Studio — Desara Studio Admin",
}

export default async function SettingsPage() {
  // Cek autentikasi
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect("/admin/login")

  // Cek role — owner atau admin
  const supabase = createAdminClient()
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single()

  const isOwner = profile?.role === "owner"

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Pengaturan Studio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola harga paket, add-on, upah staff, background, dan konfigurasi operasional tanpa coding.
        </p>
      </div>

      <SettingsClient isOwner={isOwner} />
    </div>
  )
}
