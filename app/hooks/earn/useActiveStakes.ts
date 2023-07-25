import { isOnGoing } from 'utils/earn/status'
import { useStakes } from './useStakes'

export const useActiveStakes = () => {
  const { data, isFetching, pullToRefresh, isRefreshing, isLoading } =
    useStakes()

  const now = new Date()

  const stakes = data?.filter(transaction => isOnGoing(transaction, now)) ?? []

  return { stakes, isFetching, pullToRefresh, isRefreshing, isLoading }
}
