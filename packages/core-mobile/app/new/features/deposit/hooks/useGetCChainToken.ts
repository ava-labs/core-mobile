import { NetworkContractToken, NetworkToken } from '@avalabs/vm-module-types'
import { useAvalancheErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import useCChainNetwork from 'hooks/earn/useCChainNetwork'
import { useCallback } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { findMatchingTokenWithBalance } from '../utils/findMatchingTokenWithBalance'
import { useCChainTokensWithBalance } from './useCChainTokensWithBalance'

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
  const { tokens } = useCChainTokensWithBalance()

  return useCallback(
    (asset: { symbol: string; contractAddress?: string }) => {
      return findMatchingTokenWithBalance(asset, tokens)
    },
    [tokens]
  )
}
