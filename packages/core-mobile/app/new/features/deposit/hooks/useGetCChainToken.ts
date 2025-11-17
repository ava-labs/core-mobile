import { NetworkContractToken, NetworkToken } from '@avalabs/vm-module-types'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useCallback } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { useTokensWithBalanceByNetworkForAccount } from 'features/portfolio/hooks/useTokensWithBalanceByNetworkForAccount'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'

export const useGetCChainToken = (): ((
  symbol: string,
  contractAddress?: string
) => NetworkToken | NetworkContractToken | undefined) => {
  const avalancheErc20ContractTokens = useAvalancheErc20ContractTokens()
  const cChainNetwork = useCChainNetwork()

  return useCallback(
    (symbol: string, contractAddress?: string) => {
      if (contractAddress) {
        const token = avalancheErc20ContractTokens.find(
          item => item.address.toLowerCase() === contractAddress.toLowerCase()
        )
        if (token) {
          return token
        }
      }

      if (symbol.toLowerCase() === 'avax') {
        return cChainNetwork?.networkToken
      }

      return undefined
    },
    [avalancheErc20ContractTokens, cChainNetwork]
  )
}

export const useGetCChainTokenWithBalance = (): ((asset: {
  symbol: string
  contractAddress?: string
}) => LocalTokenWithBalance | undefined) => {
  const activeAccount = useSelector(selectActiveAccount)
  const cChainNetwork = useCChainNetwork()
  const tokens = useTokensWithBalanceByNetworkForAccount(
    activeAccount,
    cChainNetwork?.chainId
  )
  return useCallback(
    (asset: { symbol: string; contractAddress?: string }) => {
      return findMatchingTokenWithBalance(asset, tokens)
    },
    [tokens]
  )
}
