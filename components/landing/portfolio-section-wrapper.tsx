import { createAdminClient } from "@/lib/supabase/server"
import { PortfolioSection } from "./portfolio-section"

// Server Component — fetch portfolio aktif dari DB, revalidate setiap 60 detik
export const revalidate = 60

export async function PortfolioSectionWrapper() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any

  const { data } = await supabase
    .from("portfolio")
    .select("id, image_url, alt_text, kategori, caption")
    .eq("aktif", true)
    .order("urutan", { ascending: true })

  return <PortfolioSection initialItems={data ?? []} />
}
