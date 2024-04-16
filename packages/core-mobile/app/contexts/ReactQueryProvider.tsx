import React, { PropsWithChildren, useEffect } from 'react'
import { Query, QueryClient, focusManager } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'
import { AppState, AppStateStatus } from 'react-native'
import { queryStorage } from 'store/utils/mmkv'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { ChartDataSchema } from 'services/token/types'

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
  deserialize: cachedString => {
    const parsedString = JSON.parse(cachedString)
    const transformedChartData = parsedString.clientState.queries.find(
      (query: Query) => {
        if (query.queryKey.includes(ReactQueryKeys.WATCHLIST_TOKENS_AND_CHARTS))
          ChartDataSchema.safeParse(query.state.data)
      }
    )
    return {
      ...parsedString,
      clientState: {
        ...parsedString.clientState,
        queries: {
          ...parsedString.clientState.queries,
          ...transformedChartData
        }
      }
    }
  }
})

const persistOptions = {
  persister: clientPersister,
  maxAge: Infinity,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: Query) => {
      if (query.queryKey.length === 0) return false
      if (query.state.status !== 'success') return false

      return (
        query.queryKey.includes(ReactQueryKeys.WATCHLIST_PRICES) ||
        query.queryKey.includes(ReactQueryKeys.WATCHLIST_TOKENS_AND_CHARTS) ||
        query.queryKey.includes(ReactQueryKeys.NETWORKS)
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

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}>
      {children}
    </PersistQueryClientProvider>
  )
}
