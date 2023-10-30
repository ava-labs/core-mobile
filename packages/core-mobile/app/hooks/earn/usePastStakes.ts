import { isCompleted } from 'utils/earn/status'
import { useStakes } from './useStakes'

export const usePastStakes = () => {
  const { data, isFetching, pullToRefresh, isRefreshing, isLoading } =
    useStakes()

  const now = new Date()

  const stakes =
    data?.filter(transaction => isCompleted(transaction, now)) ?? []

  return { stakes, isFetching, pullToRefresh, isRefreshing, isLoading }
}
