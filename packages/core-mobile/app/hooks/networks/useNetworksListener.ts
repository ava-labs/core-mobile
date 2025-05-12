import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { QueryCacheNotifyEvent, QueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onNetworksFetched, onNetworksFetchedSuccess } from 'store/network'
import { toggleDeveloperMode } from 'store/settings/advanced'

export const useNetworksListener = (queryClient: QueryClient): void => {
  const dispatch = useDispatch()

  // @ts-ignore
  useEffect(() => {
    return dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode),
        effect: async () => {
          dispatch(onNetworksFetched)
        }
      })
    )
  }, [dispatch])

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
