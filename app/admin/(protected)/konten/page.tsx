import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { KontenClient } from "@/components/admin/konten/konten-client"

export const metadata: Metadata = {
  title: "Konten Halaman Depan — Desara Studio Admin",
}

export default async function KontenPage() {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Konten Halaman Depan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola testimoni client yang tampil di landing page.
        </p>
      </div>
      <KontenClient />
    </div>
  )
}
