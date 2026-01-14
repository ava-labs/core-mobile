import { addListener, isAnyOf } from '@reduxjs/toolkit'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { toggleDeveloperMode } from 'store/settings/advanced'
import { fetchWatchlist } from 'store/watchlist'

export const useWatchlistListener = (): void => {
  const dispatch = useDispatch()

  // @ts-ignore
  useEffect(() => {
    return dispatch(
      addListener({
        matcher: isAnyOf(toggleDeveloperMode, fetchWatchlist),
        effect: async () => {
          await queryClient.invalidateQueries({
            queryKey: [ReactQueryKeys.WATCHLIST_TOP_TOKENS]
          })
        }
      })
    )
  }, [dispatch])
}
