import { createAdminClient } from "@/lib/supabase/server"
import { PortfolioGrid } from "@/components/admin/portfolio/portfolio-grid"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Portfolio — Admin Desara Studio",
}

export default async function PortfolioPage() {
  // Cek autentikasi
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) redirect("/admin/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  // Ambil semua foto portfolio (termasuk non-aktif), sort by urutan
  const { data: items } = await supabase
    .from("portfolio")
    .select("*")
    .order("urutan", { ascending: true })

  // Ambil nama admin dari profil
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("nama")
    .eq("user_id", user.id)
    .single()

  const adminName = profile?.nama ?? user.email ?? "Admin"

  return (
    <div className="p-6 bg-[#F8F5F0] min-h-full">
      <PortfolioGrid
        initialItems={items ?? []}
        adminName={adminName}
      />
    </div>
  )
}
