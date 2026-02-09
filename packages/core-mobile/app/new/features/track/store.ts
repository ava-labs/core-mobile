import { ViewOption } from 'common/types'
import { ZustandStorageKeys } from 'resources/Constants'
import { zustandMMKVStorage } from 'utils/mmkv/storages'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
