import { ViewOption } from 'common/types'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getViewOptionToPersist } from './utils'

export const useIsRefetchingAccountBalances = createZustandStore<
  Record<string, boolean>
>({})

export const useIsRefetchingWalletXpBalances = createZustandStore<
  Record<string, boolean>
>({})

interface PortfolioViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

// Create a store that can be used outside of React components
export const portfolioViewStore = create<PortfolioViewState>()(
  persist(
    (set, get) => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) => {
        const selectedView = get().selectedView

        if (view === ViewOption.LargeGrid || view === ViewOption.CompactGrid) {
          set({
            selectedView: view
          })
        }
        const viewOptionToPersist = getViewOptionToPersist(selectedView, view)
        if (viewOptionToPersist) {
          set({
            selectedView: viewOptionToPersist
          })
        }
      }
    }),
    {
      name: ZustandStorageKeys.PORTFOLIO_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const usePortfolioView = (): PortfolioViewState => {
  return portfolioViewStore()
}
