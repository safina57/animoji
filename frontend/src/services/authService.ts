import type { User } from "@customTypes/auth";

const API_URL = import.meta.env.VITE_API_URL;

export const authService = {
  loginWithGoogle: () => {
    window.location.href = `${API_URL}/auth/google/login`;
  },

  getMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    return response.json();
  },
};
