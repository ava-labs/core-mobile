import { useStakes } from './useStakes'

export const useStake = (txHash: string) => {
  const { data } = useStakes()

  return data?.find(transaction => transaction.txHash === txHash)
}
