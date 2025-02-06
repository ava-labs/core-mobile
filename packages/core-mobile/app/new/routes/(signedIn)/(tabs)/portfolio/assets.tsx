import React from 'react'
import {} from 'react-native-gesture-handler'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import { useSelector } from 'react-redux'
import {
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { RootState } from 'store'
import { TokensList } from 'features/portfolio/components/assets/TokensList'
import { TokenType } from '@avalabs/vm-module-types'

const PortfolioAssetsScreen = (): JSX.Element => {
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const nonNftTokens = tokens.filter(
    token => token.type !== TokenType.ERC1155 && token.type !== TokenType.ERC721
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  if (tokens.length === 0 && !isBalanceLoading && !isRefetchingBalance) {
    return <EmptyAssets />
  }

  return <TokensList tokens={nonNftTokens} />
}

export default PortfolioAssetsScreen
