import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PegawaiClient } from "@/components/admin/pegawai/pegawai-client"

export const metadata: Metadata = {
  title: "Pegawai Tetap — Desara Studio Admin",
}

export default async function PegawaiPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { user } } = await (createClient() as any).auth.getUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0d1f3c]">Pegawai Tetap</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola data pegawai tetap dan gaji bulanan. Gaji otomatis masuk ke pengeluaran saat di-generate.
        </p>
      </div>

      <PegawaiClient />
    </div>
  )
}
