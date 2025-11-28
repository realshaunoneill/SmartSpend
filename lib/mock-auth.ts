"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  isAuthenticated: boolean
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string
  } | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: async (email: string, password: string) => {
        // Mock login - in production this would call Clerk
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (email && password) {
          set({
            isAuthenticated: true,
            user: {
              id: "user-123",
              email: email,
              full_name: email.split("@")[0],
              avatar_url: "/diverse-user-avatars.png",
            },
          })
          return true
        }
        return false
      },
      logout: () => {
        set({ isAuthenticated: false, user: null })
      },
    }),
    {
      name: "smartspend-auth",
    },
  ),
)
