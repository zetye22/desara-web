"use client"

import { createContext, useContext } from "react"

export type UserRole = "owner" | "admin"

const RoleContext = createContext<UserRole>("owner")

export function RoleProvider({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole() {
  const role = useContext(RoleContext)
  return {
    role,
    isOwner: role === "owner",
    isAdmin: role === "admin",
  }
}
