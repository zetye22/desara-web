  import { createAdminClient } from "@/lib/supabase/server"
  import { createClient } from "@/lib/supabase/server"
  import BookingListClient from "@/components/admin/bookings/booking-list-client"
  import type { BookingRow } from "@/components/admin/bookings/types"

  // Paksa halaman selalu fetch ulang dari server, tidak boleh pakai cache router
  export const dynamic = "force-dynamic"

  export default async function BookingsPage() {
    const supabase = createAdminClient()

    // 1. Ambil semua booking (bukan cancel), urut tgl foto terbaru
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `id, kode_booking, nama_client, no_wa, paket_id, nama_paket, tgl_foto,
        jam_mulai, jam_selesai, jumlah_orang, background_dipilih,
        status_sesi, status_pembayaran, total_tagihan, dp_dibayar, subtotal_paket,
        subtotal_addon, email, bukti_transfer_url, kategori_sesi, catatan, created_at,
        photographer_1_id, photographer_2_id, editor_id,
        upah_pg1, upah_pg2, upah_editor, total_upah_staff`
      )
      .neq("status_sesi", "cancel")
      .order("tgl_foto", { ascending: false })
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError)
    }

    // 1b. Ambil nama staff (pg1/pg2/editor) secara terpisah
    const rawBookings = bookings ?? []
    const staffIds = new Set<string>()
    for (const b of rawBookings) {
      if (b.photographer_1_id) staffIds.add(b.photographer_1_id)
      if (b.photographer_2_id) staffIds.add(b.photographer_2_id)
      if (b.editor_id)         staffIds.add(b.editor_id)
    }
    const staffMap = new Map<string, string>()
    if (staffIds.size > 0) {
      const { data: staffData } = await supabase
        .from("staff_upah")
        .select("id, nama")
        .in("id", Array.from(staffIds))
      for (const s of (staffData ?? [])) staffMap.set(s.id, s.nama)
    }
    const allBookings: BookingRow[] = rawBookings.map((b: BookingRow) => ({
      ...b,
      pg1: b.photographer_1_id ? { id: b.photographer_1_id, nama: staffMap.get(b.photographer_1_id) ?? "?" } : null,
      pg2: b.photographer_2_id ? { id: b.photographer_2_id, nama: staffMap.get(b.photographer_2_id) ?? "?" } : null,
      ed:  b.editor_id          ? { id: b.editor_id,         nama: staffMap.get(b.editor_id)         ?? "?" } : null,
    }))

    // 2. Ambil booking_id yang punya addon lapangan
    const { data: addonRows } = await supabase
      .from("booking_addons")
      .select("booking_id")
      .eq("source", "lapangan")

    // Buat Set dari booking_id yang punya lapangan addon
    const addonLapanganIds = new Set<string>(
      (addonRows ?? []).map((r: { booking_id: string }) => r.booking_id)
    )

    // 3. Ambil nama admin dari session
    let adminName = "Admin"
    try {
      const {
        data: { user },
      } = await createClient().auth.getUser()

      if (user) {
        // Coba ambil dari admin_profiles
        const { data: profile } = await supabase
          .from("admin_profiles")
          .select("nama")
          .eq("user_id", user.id)
          .single()

        if (profile?.nama) {
          adminName = profile.nama
        } else if (user.email) {
          // Fallback ke email
          adminName = user.email.split("@")[0]
        }
      }
    } catch {
      // Gunakan default "Admin" jika gagal
    }

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#F8F5F0" }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* ===== Heading ===== */}
          <div className="mb-6">
            <h1
              className="text-2xl font-bold sm:text-3xl"
              style={{ color: "#0d1f3c" }}
            >
              Manajemen Booking
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Total{" "}
              <span className="font-semibold text-gray-700">
                {allBookings.length}
              </span>{" "}
              booking aktif
            </p>
          </div>

          {/* ===== List Booking ===== */}
          <BookingListClient
            initialBookings={allBookings}
            addonLapanganIds={addonLapanganIds}
            adminName={adminName}
          />
        </div>
      </div>
    )
  }
