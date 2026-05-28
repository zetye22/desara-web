export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { AdminLayoutClient } from "@/components/admin/admin-layout-client"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Cek sesi — middleware sudah proteksi, ini sebagai double-check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")

  // Ambil profil admin
  const adminSupabase = createAdminClient()
  const { data: profile } = await adminSupabase
    .from("admin_profiles")
    .select("nama, role")
    .eq("user_id", user.id)
    .single()

  const namaAdmin = profile?.nama ?? user.email ?? "Admin"
  const role: "owner" | "admin" = profile?.role === "owner" ? "owner" : "admin"

  return (
    <AdminLayoutClient namaAdmin={namaAdmin} role={role}>
      {children}
    </AdminLayoutClient>
  )
}
