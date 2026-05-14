"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get("redirectTo") ?? "/admin/dashboard"

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError("Email atau password salah. Silakan coba lagi.")
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F8F5F0] flex items-center justify-center px-4">

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0d1f3c] mb-4">
            <Lock className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <h1 className="text-xl font-bold text-[#0d1f3c]">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">Desara Home Studio</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoComplete="email"
                className="pl-9 rounded-xl h-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="pl-9 pr-10 rounded-xl h-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#0d1f3c] hover:bg-[#162d56] text-white rounded-xl font-semibold mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Masuk…</>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
