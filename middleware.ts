import { type NextRequest, NextResponse } from "next/server"
import { updateSession, requireAdmin } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === "/admin/login"

  if (pathname.startsWith("/admin")) {
    const user = await requireAdmin(request)

    // Sudah login, akses halaman login → redirect ke dashboard
    if (user && isLoginPage) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // Belum login, akses halaman selain login → redirect ke login
    if (!user && !isLoginPage) {
      const loginUrl = new URL("/admin/login", request.url)
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Refresh session untuk semua halaman
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Jalankan di semua path kecuali file statis
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
