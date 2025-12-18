import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useAvailableNativeTokenBalanceForNetworkAndAccount } from 'features/portfolio/hooks/useAvailableNativeTokenBalanceForNetworkAndAccount'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { useMemo } from 'react'
import useCChainNetwork from './useCChainNetwork'

export const useCChainBalance = (): TokenUnit | undefined => {
  const activeAccount = useSelector(selectActiveAccount)
  const cChainNetwork = useCChainNetwork()
  const balance = useAvailableNativeTokenBalanceForNetworkAndAccount(
    activeAccount,
    cChainNetwork?.chainId
  )

  return useMemo(() => {
    if (!cChainNetwork) return undefined

    return new TokenUnit(
      balance,
      cChainNetwork?.networkToken.decimals,
      cChainNetwork?.networkToken.symbol
    )
  }, [balance, cChainNetwork])
}
