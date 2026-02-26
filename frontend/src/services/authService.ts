import type { User } from "@customTypes/auth"

const API_URL = import.meta.env.VITE_API_URL

export const authService = {
  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google/login`
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send cookies with request
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user profile")
    }

    return response.json()
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Send cookies with request
    })

    if (!response.ok) {
      throw new Error("Failed to logout")
    }
  },
}
