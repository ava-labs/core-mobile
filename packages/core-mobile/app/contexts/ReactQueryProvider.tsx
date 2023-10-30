import React, { useEffect } from 'react'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  focusManager
} from '@tanstack/react-query'
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/react-query'
import { AppState, AppStateStatus } from 'react-native'

const queryCache = new QueryCache()
export const queryClient = new QueryClient({
  queryCache: queryCache,
  defaultOptions: {
    queries: {
      staleTime: 10000
    }
  }
})

const onAppStateChange = (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active')
}

export const ReactQueryProvider: React.FC = ({ children }) => {
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
