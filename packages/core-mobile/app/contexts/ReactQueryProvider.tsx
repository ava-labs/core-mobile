import React, { PropsWithChildren, useEffect } from 'react'
import { Query, QueryClient, focusManager } from '@tanstack/react-query'
import {
  PersistQueryClientProvider,
  removeOldestQuery
} from '@tanstack/react-query-persist-client'
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'
import { AppState, AppStateStatus } from 'react-native'
import { queryStorage } from 'utils/mmkv'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { useNetworksListener } from 'hooks/networks/useNetworksListener'
import { useWatchlistListener } from 'hooks/watchlist/useWatchlistListener'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      gcTime: Infinity
    }
  }
})

const clientPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      return queryStorage.getString(key) || null
    },
    setItem: (key: string, value: string) => {
      return queryStorage.set(key, value)
    },
    removeItem: (key: string) => {
      return queryStorage.delete(key)
    }
  },
  retry: removeOldestQuery
})

const persistOptions = {
  persister: clientPersister,
  maxAge: Infinity,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) => {
      if (query.queryKey.length === 0) return false
      if (query.state.status !== 'success') return false

      return (
        query.queryKey.includes(ReactQueryKeys.NETWORKS) ||
        query.queryKey.includes(ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS)
      )
    }
  }
}

const onAppStateChange = (status: AppStateStatus): void => {
  focusManager.setFocused(status === 'active')
}

export const ReactQueryProvider: React.FC<PropsWithChildren> = ({
  children
}) => {
  // manage online status
  useEffect(() => {
    return NetInfo.addEventListener(state => {
      const online =
        state.isConnected != null &&
        state.isConnected &&
        Boolean(state.isInternetReachable)

      onlineManager.setOnline(online)
    })
  }, [])

  // manage app focus status
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange)
    return () => {
      sub.remove()
    }
  }, [])

  // refetch networks on app unlock or developer mode toggle
  useNetworksListener()

  // refetch watchlist on developer mode toggle or watchlist fetch
  useWatchlistListener()

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
