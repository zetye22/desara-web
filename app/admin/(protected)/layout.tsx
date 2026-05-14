export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { AdminLayoutClient } from "@/components/admin/admin-layout-client"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Cek sesi — middleware sudah proteksi, ini sebagai double-check
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (supabase as any).auth.getUser()
  if (!user) redirect("/admin/login")

  // Ambil profil admin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSupabase = createAdminClient() as any
  const { data: profile } = await adminSupabase
    .from("admin_profiles")
    .select("nama, role")
    .eq("user_id", user.id)
    .single()

  const namaAdmin = profile?.nama ?? user.email ?? "Admin"

  return (
    <AdminLayoutClient namaAdmin={namaAdmin}>
      {children}
    </AdminLayoutClient>
  )
}
