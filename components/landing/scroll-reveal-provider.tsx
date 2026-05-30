"use client"

import { useEffect } from "react"

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isCssSupported = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll()")

    // Set stagger delays pada children dari [data-stagger] container
    const applyStagger = () => {
      document.querySelectorAll("[data-stagger]").forEach((parent) => {
        const gap = parseInt(parent.getAttribute("data-stagger") ?? "80")
        Array.from(parent.children).forEach((child, i) => {
          ;(child as HTMLElement).style.setProperty("--stagger-delay", `${i * gap}ms`)
        })
      })
    }
    applyStagger()

    if (isCssSupported) return  // CSS animation-timeline menangani semuanya

    // Fallback IntersectionObserver untuk browser lama
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ;(entry.target as HTMLElement).classList.add("in-view")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
    )

    document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach(
      (el) => observer.observe(el)
    )

    return () => observer.disconnect()
  }, [])

  return <>{children}</>
}
