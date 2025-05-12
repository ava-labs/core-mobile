import { QueryCacheNotifyEvent, QueryClient } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onNetworksFetchedSuccess } from 'store/network'

export const useNetworksListener = (queryClient: QueryClient): void => {
  const dispatch = useDispatch()

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
