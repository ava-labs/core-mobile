import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import NetworkService from 'services/network/NetworkService'
import { onAppUnlocked } from 'store/app'
import { Networks, setNetworks } from 'store/network'
import { toggleDeveloperMode } from 'store/settings/advanced'

export const useGetNetworks = (): UseQueryResult<Networks, Error> => {
  const dispatch = useDispatch()

  useEffect(() => {
    const unsubscribe = dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode, onAppUnlocked),
        effect: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ReactQueryKeys.NETWORKS]
          })
          dispatch(setNetworks)
        }
      })
    )
    return () => {
      unsubscribe
    }
  }, [dispatch])

  return useQuery({
    queryKey: [ReactQueryKeys.NETWORKS],
    queryFn: () => NetworkService.getNetworks(),
    staleTime: Infinity
  })
}
