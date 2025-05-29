import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { QueryCacheNotifyEvent, QueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import { onNetworksFetchedSuccess } from 'store/network'
import { toggleDeveloperMode } from 'store/settings/advanced'

export const useNetworksListener = (queryClient: QueryClient): void => {
  const dispatch = useDispatch()

  // @ts-ignore
  useEffect(() => {
    // This is used to invalidate the networks query when the developer mode is toggled or the app is unlocked.
    // This ensures that the networks are always up to date when the user interacts with the app.
    // we ran into issues with network RpcUrls not being updated and send flow was broken due to networks still using the unsupported RpcUrls
    return dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode, onAppUnlocked),
        effect: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ReactQueryKeys.NETWORKS]
          })
        }
      })
    )
  }, [dispatch, queryClient])

  const callback = useCallback(
    (event: QueryCacheNotifyEvent): void => {
      if (
        event.query.queryKey?.[0] === ReactQueryKeys.NETWORKS &&
        event.type === 'updated'
      ) {
        dispatch(onNetworksFetchedSuccess)
      }
    },
    [dispatch]
  )

  useEffect(() => {
    return queryClient.getQueryCache().subscribe(callback)
  }, [callback, queryClient])
}
