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
      selectedView: CollectibleViewOption.LargeGrid,
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
      selectedView: ViewOption.Grid,
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

// Market view store
interface MarketViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

export const marketViewStore = create<MarketViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
    }),
    {
      name: ZustandStorageKeys.MARKET_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useMarketView = (): MarketViewState => {
  return marketViewStore()
}

// Favorites view store
interface FavoritesViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

export const favoritesViewStore = create<FavoritesViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
    }),
    {
      name: ZustandStorageKeys.FAVORITES_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useFavoritesView = (): FavoritesViewState => {
  return favoritesViewStore()
}

// Track search view store
interface TrackSearchViewState {
  selectedView: ViewOption
  setSelectedView: (value: string) => void
}

export const trackSearchViewStore = create<TrackSearchViewState>()(
  persist(
    set => ({
      selectedView: ViewOption.List,
      setSelectedView: (view: string) =>
        set({
          selectedView: view as ViewOption
        })
    }),
    {
      name: ZustandStorageKeys.TRACK_SEARCH_VIEW,
      storage: zustandMMKVStorage
    }
  )
)

export const useTrackSearchView = (): TrackSearchViewState => {
  return trackSearchViewStore()
}
