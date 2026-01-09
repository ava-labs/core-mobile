import { CollectibleViewOption, ViewOption } from 'common/types'
import { createZustandStore } from 'common/utils/createZustandStore'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useIsRefetchingAccountBalances = createZustandStore<
  Record<string, boolean>
>({})

export const useIsRefetchingWalletXpBalances = createZustandStore<
  Record<string, boolean>
>({})

// Portfolio view store
interface PortfolioViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

// Create a store that can be used outside of React components
export const portfolioViewStore = create<PortfolioViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
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

// Collectibles view store
interface CollectiblesViewState {
  selectedView: CollectibleViewOption
  setSelectedView: (value: string) => void
}

export const collectiblesViewStore = create<CollectiblesViewState>()(
  persist(
    set => ({
      selectedView: CollectibleViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as CollectibleViewOption
        })
    }),
    {
      name: ZustandStorageKeys.COLLECTIBLES_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useCollectiblesView = (): CollectiblesViewState => {
  return collectiblesViewStore()
}

// DeFi view store
interface DeFiViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

export const defiViewStore = create<DeFiViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
    }),
    {
      name: ZustandStorageKeys.DEFI_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useDeFiView = (): DeFiViewState => {
  return defiViewStore()
}

// Track view store
interface TrackViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

export const trackViewStore = create<TrackViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
    }),
    {
      name: ZustandStorageKeys.TRACK_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useTrackView = (): TrackViewState => {
  return trackViewStore()
}
