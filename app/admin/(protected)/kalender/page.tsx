import { redirect } from "next/navigation"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import KalenderClient from "@/components/admin/kalender/kalender-client"

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: { tanggal?: string }
}) {
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect("/admin/login")

  // Default tanggal: hari ini (timezone Jakarta)
  const todayJakarta = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
  ).toISOString().split("T")[0]

  const tanggal = searchParams.tanggal ?? todayJakarta

  const supabase = createAdminClient()
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, kode_booking, nama_client, nama_paket, jam_mulai, jam_selesai, status_sesi")
    .eq("tgl_foto", tanggal)
    .order("jam_mulai", { ascending: true })

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-[#0d1f3c]">Kalender Studio</h1>
        <p className="text-sm text-gray-500 mt-0.5">Timeline booking harian</p>
      </div>
      <KalenderClient tanggal={tanggal} bookings={bookings ?? []} />
    </div>
  )
}
