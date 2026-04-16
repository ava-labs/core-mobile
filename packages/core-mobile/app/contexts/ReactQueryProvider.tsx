import React, { PropsWithChildren, useEffect } from 'react'
import {
  Query,
  QueryCache,
  QueryClient,
  focusManager
} from '@tanstack/react-query'
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
import Logger from 'utils/Logger'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      gcTime: Infinity,
      refetchOnReconnect: true
    }
  },
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      Logger.error('[ReactQueryProvider] Query error', error)
    }
  })
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
      return queryStorage.remove(key)
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
        query.queryKey.includes(
          ReactQueryKeys.LAST_TRANSACTED_ERC20_NETWORKS
        ) ||
        query.queryKey.includes(ReactQueryKeys.XP_ADDRESSES)
      )
    }
  }
}

const onAppStateChange = (status: AppStateStatus): void => {
  focusManager.setFocused(status === 'active')
}

// Connectivity detection via NetInfo with HTTP-based reachability.
//
// useNativeReachability=false makes NetInfo use NSURLSession HTTP checks
// instead of SCNetworkReachability for determining isInternetReachable.
// This provides more accurate connectivity state — verifying actual
// internet access rather than just local network connection.
//
// NOTE: iOS Simulator has a known Apple bug (rdar://29913522, since iOS 10)
// where SCNetworkReachability callbacks never fire when transitioning from
// offline to online. This causes the entire network stack (fetch, NetInfo,
// NSURLSession) to remain stuck after starting offline. This does NOT affect
// real iOS devices or Android — both recover correctly in all scenarios.
// See: https://github.com/react-native-netinfo/react-native-netinfo/issues/7

const REACHABILITY_URL = 'https://clients3.google.com/generate_204'

NetInfo.configure({
  reachabilityUrl: REACHABILITY_URL,
  reachabilityTest: async (response: Response) => response.status === 204,
  reachabilityShortTimeout: 5 * 1000,
  reachabilityLongTimeout: 10 * 1000,
  reachabilityRequestTimeout: 3 * 1000,
  useNativeReachability: false
})

// Track confirmed reachability so we can detect the first online
// confirmation (null → true) and offline → online transitions.
let lastReachable: boolean | null = null

// NetInfo event listener: uses HTTP-based isInternetReachable as primary
// signal, with isConnected as fast fallback for disconnect detection.
onlineManager.setEventListener(setOnline => {
  const unsub = NetInfo.addEventListener(state => {
    if (state.isInternetReachable !== null) {
      const wasReachable = lastReachable
      lastReachable = state.isInternetReachable

      setOnline(state.isInternetReachable)

      // When internet becomes reachable from any non-confirmed state
      // (null = cold start, false = was offline), invalidate all queries
      // so active observers refetch fresh data.
      if (state.isInternetReachable && wasReachable !== true) {
        queryClient.invalidateQueries()
      }
    } else if (state.isConnected === false) {
      lastReachable = false
      setOnline(false)
    }
  })
  return () => unsub()
})

export const ReactQueryProvider: React.FC<PropsWithChildren> = ({
  children
}) => {
  // manage app focus status
  useEffect(() => {
    const sub = AppState.addEventListener('change', onAppStateChange)
    return () => {
      sub.remove()
    }
  }, [])

  // refetch networks on app unlock or developer mode toggle
  useNetworksListener(queryClient)

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
