"use client"

import { useEffect } from "react"

export function ScrollRevealProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const observe = (observer: IntersectionObserver, root: Element | Document = document) => {
      root.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => {
        if (!el.classList.contains("in-view")) observer.observe(el)
      })
    }

    const applyStagger = (root: Element | Document = document) => {
      root.querySelectorAll("[data-stagger]").forEach((parent) => {
        const gap = parseInt(parent.getAttribute("data-stagger") ?? "80")
        Array.from(parent.children).forEach((child, i) => {
          ;(child as HTMLElement).style.transitionDelay = `${i * gap}ms`
        })
      })
    }

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

    // Init awal
    const t = setTimeout(() => {
      applyStagger()
      observe(observer)
    }, 80)

    // MutationObserver: tangkap elemen .reveal yang ditambah secara dinamis
    const mutation = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          // Cek node itu sendiri
          if (node.classList?.contains("reveal") ||
              node.classList?.contains("reveal-left") ||
              node.classList?.contains("reveal-right") ||
              node.classList?.contains("reveal-scale")) {
            if (!node.classList.contains("in-view")) observer.observe(node)
          }
          // Cek children di dalamnya
          observe(observer, node)
          applyStagger(node)
        })
      })
    })
    mutation.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(t)
      observer.disconnect()
      mutation.disconnect()
    }
  }, [])

  return <>{children}</>
}
