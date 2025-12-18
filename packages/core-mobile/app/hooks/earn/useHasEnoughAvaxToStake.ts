import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useEffect, useState } from 'react'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'

export const useHasEnoughAvaxToStake = (): {
  hasEnoughAvax: boolean | undefined
} => {
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const claimableBalance = useGetClaimableBalance()
  const cChainNetwork = useCChainNetwork()
  const stuckBalance = useGetStuckBalance()
  const cChainNetworkToken = cChainNetwork?.networkToken
  const [hasEnoughAvax, setHasEnoughAvax] = useState<boolean | undefined>(
    undefined
  )

  useEffect(() => {
    if (cChainBalance !== undefined && cChainNetworkToken) {
      const availableAvax = cChainBalance
        .add(claimableBalance ?? 0)
        .add(stuckBalance ?? 0)

      setHasEnoughAvax(availableAvax.gt(minStakeAmount))
    }
  }, [
    cChainBalance,
    minStakeAmount,
    stuckBalance,
    claimableBalance,
    cChainNetworkToken
  ])

  return { hasEnoughAvax }
}
