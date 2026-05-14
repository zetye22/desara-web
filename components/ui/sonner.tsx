"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: "font-sans text-sm",
        },
      }}
      {...props}
    />
  )
}
