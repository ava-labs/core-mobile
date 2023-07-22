import { isOnGoing } from 'utils/earn/status'
import { useStakes } from './useStakes'

export const useActiveStakes = () => {
  const { data, isFetching, refetch, isRefetching, isLoading } = useStakes()

  const now = new Date()

  const stakes = data?.filter(transaction => isOnGoing(transaction, now)) ?? []

  return { stakes, isFetching, refetch, isRefetching, isLoading }
}
