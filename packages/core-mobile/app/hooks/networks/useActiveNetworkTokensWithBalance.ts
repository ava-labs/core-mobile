import { BN } from 'bn.js'
import { useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { getLocalTokenId } from 'store/balance/utils'
import { useNetworkContractTokens } from './useNetworkContractTokens'
import { useNetworks } from './useNetworks'

export const useActiveNetworkTokensWithBalance =
  (): LocalTokenWithBalance[] => {
    const { activeNetwork } = useNetworks()
    const activeNetworkContractTokens = useNetworkContractTokens(activeNetwork)

    return useMemo(() => {
      return (
        activeNetworkContractTokens.map(token => {
          return {
            ...token,
            localId: getLocalTokenId(token),
            balance: new BN(0),
            balanceInCurrency: 0,
            balanceDisplayValue: '0',
            balanceCurrencyDisplayValue: '0',
            priceInCurrency: 0,
            marketCap: 0,
            change24: 0,
            vol24: 0
          } as LocalTokenWithBalance
        }) ?? []
      )
    }, [activeNetworkContractTokens])
  }
