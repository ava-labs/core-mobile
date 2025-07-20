import { create } from 'zustand'

export const pendingSeedlessWalletNameStore = create<{
  pendingSeedlessWalletName: string | undefined
  setPendingSeedlessWalletName: (name: string | undefined) => void
}>(set => ({
  pendingSeedlessWalletName: undefined,
  setPendingSeedlessWalletName: (name: string | undefined) =>
    set({ pendingSeedlessWalletName: name })
}))

export const usePendingSeedlessWalletName = (): {
  pendingSeedlessWalletName: string | undefined
  setPendingSeedlessWalletName: (name: string | undefined) => void
} => {
  return pendingSeedlessWalletNameStore()
}
