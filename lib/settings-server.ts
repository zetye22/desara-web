import { createAdminClient } from "@/lib/supabase/server"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SettingsRow = { key: string; value: any; kategori: string; deskripsi: string | null }

export async function getSettings(keys?: string[]): Promise<Record<string, unknown>> {
  const supabase = createAdminClient()

  let query = supabase.from("settings").select("key, value, kategori, deskripsi")

  if (keys && keys.length > 0) {
    query = query.in("key", keys)
  }

  const { data, error } = await query

  if (error || !data) return {}

  return Object.fromEntries(data.map((r: SettingsRow) => [r.key, r.value]))
}

export async function getSettingsByKategori(kategori: string): Promise<SettingsRow[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("settings")
    .select("key, value, kategori, deskripsi")
    .eq("kategori", kategori)
    .order("key")

  return data ?? []
}
