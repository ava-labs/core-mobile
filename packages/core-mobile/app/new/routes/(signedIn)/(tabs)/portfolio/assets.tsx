import React from 'react'
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
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { useIsOnline } from 'common/hooks/useIsOnline'

const PortfolioAssetsScreen = (): JSX.Element | undefined => {
  const { refetch } = useSearchableTokenList()
  const isOnline = useIsOnline()
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const nonNftTokens = tokens.filter(
    token => token.type !== TokenType.ERC1155 && token.type !== TokenType.ERC721
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const renderContent = (): React.JSX.Element => {
    if (!isOnline) {
      return <ErrorState onPress={refetch} />
    }
    if (isBalanceLoading || isRefetchingBalance) {
      return <LoadingState />
    }
    if (tokens.length === 0) {
      return <EmptyAssets />
    }
    return <TokensList tokens={nonNftTokens} />
  }

  return renderContent()
}

export default PortfolioAssetsScreen
