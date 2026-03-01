import { create } from "zustand";
import { api } from "../api/client";

// Auth state — NO token stored anywhere in JS
// The token lives only in an HttpOnly cookie managed by the browser
export const useAuthStore = create((set) => ({
  user:    null,   // { username } after login
  checked: false,  // has session been verified?

  // Check if session cookie is still valid
  check: async () => {
    try {
      const data = await api.getStats(); // protected route
      set({ user: { username: "admin" }, checked: true });
      return true;
    } catch {
      set({ user: null, checked: true });
      return false;
    }
  },

  login: async (username, password) => {
    const data = await api.login({ username, password });
    set({ user: { username: data.username }, checked: true });
    return data;
  },

  logout: async () => {
    await api.logout();
    set({ user: null, checked: true });
  },
}));
