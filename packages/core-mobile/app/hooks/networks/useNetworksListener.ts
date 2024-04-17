import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { onAppUnlocked } from 'store/app'
import { onNetworksFetched } from 'store/network'
import { toggleDeveloperMode } from 'store/settings/advanced'

export const useNetworksListener = (): void => {
  const dispatch = useDispatch()

  useEffect(() => {
    const listener = dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode, onAppUnlocked),
        effect: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ReactQueryKeys.NETWORKS]
          })
          dispatch(onNetworksFetched)
        }
      })
    )
    return listener.payload.unsubscribe
  }, [dispatch])
}
