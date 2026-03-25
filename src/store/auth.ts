import { create } from 'zustand'

export type AuthState = {
  accessToken: string | null
  email: string | null
  setSession: (args: { accessToken: string; email: string | null }) => void
  clear: () => void
}

const storageKey = 'f1prediction.auth'

function loadInitial(): Pick<AuthState, 'accessToken' | 'email'> {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { accessToken: null, email: null }
    const parsed = JSON.parse(raw) as { accessToken?: unknown; email?: unknown }
    return {
      accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : null,
      email: typeof parsed.email === 'string' ? parsed.email : null,
    }
  } catch {
    return { accessToken: null, email: null }
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitial(),
  setSession: ({ accessToken, email }) => {
    set({ accessToken, email })
    try {
      localStorage.setItem(storageKey, JSON.stringify({ accessToken, email }))
    } catch {
      void 0
    }
  },
  clear: () => {
    set({ accessToken: null, email: null })
    try {
      localStorage.removeItem(storageKey)
    } catch {
      void 0
    }
  },
}))
