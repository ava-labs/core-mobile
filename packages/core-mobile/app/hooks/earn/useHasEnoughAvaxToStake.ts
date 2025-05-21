import { useCChainBalance } from 'hooks/earn/useCChainBalance'
import useStakingParams from 'hooks/earn/useStakingParams'
import { useEffect, useState } from 'react'
import { useGetClaimableBalance } from 'hooks/earn/useGetClaimableBalance'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useGetStuckBalance } from 'hooks/earn/useGetStuckBalance'
import { selectActiveAccount } from 'store/account/slice'
import { useSelector } from 'react-redux'

export const useHasEnoughAvaxToStake = (): {
  hasEnoughAvax: boolean | undefined
} => {
  const activeAccount = useSelector(selectActiveAccount)
  const { minStakeAmount } = useStakingParams()
  const cChainBalance = useCChainBalance()
  const claimableBalance = useGetClaimableBalance()
  const cChainNetwork = useCChainNetwork()
  const stuckBalance = useGetStuckBalance()
  const cChainNetworkToken = cChainNetwork?.networkToken
  const [hasEnoughAvax, setHasEnoughAvax] = useState<boolean | undefined>(
    undefined
  )

  // reset hasEnoughAvax when the active account changes to avoid stale state
  useEffect(() => {
    setHasEnoughAvax(undefined)
  }, [activeAccount])

  useEffect(() => {
    if (cChainBalance.data?.balance !== undefined && cChainNetworkToken) {
      const availableAvax = new TokenUnit(
        cChainBalance.data.balance,
        cChainNetworkToken.decimals,
        cChainNetworkToken.symbol
      )
        .add(claimableBalance ?? 0)
        .add(stuckBalance ?? 0)

      setHasEnoughAvax(availableAvax.gt(minStakeAmount))
    }
  }, [
    cChainBalance?.data?.balance,
    minStakeAmount,
    stuckBalance,
    claimableBalance,
    cChainNetworkToken
  ])

  return { hasEnoughAvax }
}
