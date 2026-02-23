import { create } from 'zustand'

export const currentRouteStore = create<{
  currentRoute: string | undefined
  setCurrentRoute: (route: string) => void
}>(set => ({
  currentRoute: undefined,
  setCurrentRoute: (route: string) => set({ currentRoute: route })
}))
