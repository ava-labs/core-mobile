import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenType } from '@avalabs/vm-module-types'
import { CHAIN_IDS_WITH_INCORRECT_SYMBOL } from 'consts/chainIdsWithIncorrectSymbol'
import { useNetworks } from 'hooks/networks/useNetworks'
import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'

export const useTokenNameForDisplay = ({
  token,
  shouldShowAvaxTokenFullname = false
}: {
  token: LocalTokenWithBalance
  shouldShowAvaxTokenFullname?: boolean
}): string => {
  const { allNetworks } = useNetworks()

  return useMemo(() => {
    if (shouldShowAvaxTokenFullname) {
      if (token && isTokenWithBalanceAVM(token)) {
        return 'Avalanche X-Chain'
      }
      if (token && isTokenWithBalancePVM(token)) {
        return 'Avalanche P-Chain'
      }
    }

    if (
      CHAIN_IDS_WITH_INCORRECT_SYMBOL.includes(token.networkChainId) &&
      token.type === TokenType.NATIVE
    ) {
      return allNetworks[token.networkChainId]?.chainName ?? token.name
    }
    return token.name
  }, [allNetworks, token, shouldShowAvaxTokenFullname])
}
