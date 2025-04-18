import { LocalTokenWithBalance } from 'store/balance'
import { create } from 'zustand'

interface Actions {
  setSelectedToken: (token: LocalTokenWithBalance) => void
  updateAvailableTokens: (tokens: LocalTokenWithBalance[]) => void
  reset: () => void
}

interface State {
  selectedToken?: LocalTokenWithBalance
  availableTokens: LocalTokenWithBalance[]
}

const useSendStoreBase = create<State & Actions>(set => ({
  selectedToken: undefined,
  availableTokens: [],
  setSelectedToken: by =>
    set(state => ({
      selectedToken: state.availableTokens.find(
        token => token.symbol === by.symbol
      )
    })),
  updateAvailableTokens: (tokens: LocalTokenWithBalance[]) =>
    set({ availableTokens: tokens }),
  reset: () => set({ selectedToken: undefined, availableTokens: [] })
}))

export const useSelectedToken = (): LocalTokenWithBalance | undefined =>
  useSendStoreBase(state => state.selectedToken)

export const useAvailableTokens = (): LocalTokenWithBalance[] =>
  useSendStoreBase(state => state.availableTokens)

export const useSetSelectedToken = (): ((
  token: LocalTokenWithBalance
) => void) => useSendStoreBase(state => state.setSelectedToken)

export const useUpdateAvailableTokens = (): ((
  tokens: LocalTokenWithBalance[]
) => void) => useSendStoreBase(state => state.updateAvailableTokens)

export const useResetTokens = (): (() => void) =>
  useSendStoreBase(state => state.reset)
