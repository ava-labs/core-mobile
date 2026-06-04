import { create } from 'zustand'

export const currentRouteStore = create<{
  currentRoute: string | undefined
  topRoute: string | undefined
  setCurrentRoute: (route: string) => void
  setTopRoute: (route: string) => void
}>(set => ({
  currentRoute: undefined,
  topRoute: undefined,
  setCurrentRoute: (route: string) => set({ currentRoute: route }),
  setTopRoute: (route: string) => set({ topRoute: route })
}))
