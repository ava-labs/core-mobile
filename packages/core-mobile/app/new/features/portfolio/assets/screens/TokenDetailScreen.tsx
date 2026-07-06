import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { useErc20ContractTokens } from 'common/hooks/useErc20ContractTokens'
import { useSearchableTokenList } from 'common/hooks/useSearchableTokenList'
import { useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { NonXpTokenDetailScreen } from './NonXpTokenDetailScreen'
import { XpTokenDetailScreen } from './XpTokenDetailScreen'

export const TokenDetailScreen = (): React.JSX.Element => {
  const { localId, chainId } = useLocalSearchParams<{
    localId: string
    chainId: string
  }>()
  const erc20ContractTokens = useErc20ContractTokens()
  // Keep zero-balance tokens visible so the page doesn't crash after sending max balance.
  const { filteredTokenList } = useSearchableTokenList({
    tokens: erc20ContractTokens,
    hideZeroBalance: false
  })

  const token = useMemo(
    () =>
      filteredTokenList.find(
        tk => tk.localId === localId && tk.networkChainId === Number(chainId)
      ),
    [chainId, filteredTokenList, localId]
  )

  if (token && (isTokenWithBalanceAVM(token) || isTokenWithBalancePVM(token))) {
    return <XpTokenDetailScreen token={token} />
  }
  return <NonXpTokenDetailScreen token={token} />
}
