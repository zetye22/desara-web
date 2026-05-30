"use client"

import { useEffect } from "react"

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const init = () => {
      // Set stagger transition-delay pada children dari [data-stagger]
      document.querySelectorAll("[data-stagger]").forEach((parent) => {
        const gap = parseInt(parent.getAttribute("data-stagger") ?? "80")
        Array.from(parent.children).forEach((child, i) => {
          ;(child as HTMLElement).style.transitionDelay = `${i * gap}ms`
        })
      })

      // IntersectionObserver untuk semua elemen .reveal*
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              ;(entry.target as HTMLElement).classList.add("in-view")
              observer.unobserve(entry.target)
            }
          })
        },
        { threshold: 0.08, rootMargin: "0px 0px -50px 0px" }
      )

      document
        .querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
        .forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }

    // Delay kecil agar DOM hydration selesai
    const t = setTimeout(init, 80)
    return () => clearTimeout(t)
  }, [])

  return <>{children}</>
}
