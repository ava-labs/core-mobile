import React from 'react'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import { useSelector } from 'react-redux'
import {
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectNonNFTTokensWithBalanceForAccount
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { RootState } from 'store'
import { TokensList } from 'features/portfolio/components/assets/TokensList'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { useIsOnline } from 'common/hooks/useIsOnline'

const PortfolioAssetsScreen = (): JSX.Element | undefined => {
  const { refetch } = useSearchableTokenList()
  const isOnline = useIsOnline()
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectNonNFTTokensWithBalanceForAccount(state, activeAccount?.index)
  )

  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  const renderContent = (): React.JSX.Element => {
    if (isBalanceLoading || isRefetchingBalance) {
      return <LoadingState />
    }

    if (!isOnline) {
      return <ErrorState onPress={refetch} />
    }

    if (tokens.length === 0) {
      return <EmptyAssets />
    }
    return <TokensList />
  }

  return renderContent()
}

export default PortfolioAssetsScreen
