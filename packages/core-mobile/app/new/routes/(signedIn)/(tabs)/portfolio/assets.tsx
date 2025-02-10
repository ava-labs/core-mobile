import React from 'react'
import { EmptyAssets } from 'features/portfolio/components/assets/EmptyAssets'
import { useSelector } from 'react-redux'
import {
  selectIsAllBalancesInaccurate,
  selectIsLoadingBalances,
  selectIsRefetchingBalances,
  selectTokensWithBalanceForAccount
} from 'store/balance'
import { selectActiveAccount } from 'store/account'
import { RootState } from 'store'
import { TokensList } from 'features/portfolio/components/assets/TokensList'
import { TokenType } from '@avalabs/vm-module-types'
import { View } from '@avalabs/k2-alpine'
import { Dimensions } from 'react-native'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { useSearchableTokenList } from 'screens/portfolio/useSearchableTokenList'

const WINDOW_HEIGHT = Dimensions.get('window').height

const PortfolioAssetsScreen = (): JSX.Element | undefined => {
  const { refetch } = useSearchableTokenList()
  const activeAccount = useSelector(selectActiveAccount)
  const tokens = useSelector((state: RootState) =>
    selectTokensWithBalanceForAccount(state, activeAccount?.index)
  )
  const isAllBalancesInaccurate = useSelector(
    selectIsAllBalancesInaccurate(activeAccount?.index ?? 0)
  )

  const nonNftTokens = tokens.filter(
    token => token.type !== TokenType.ERC1155 && token.type !== TokenType.ERC721
  )
  const isBalanceLoading = useSelector(selectIsLoadingBalances)
  const isRefetchingBalance = useSelector(selectIsRefetchingBalances)

  if (isBalanceLoading || isRefetchingBalance) return undefined

  if (tokens.length === 0 || isAllBalancesInaccurate) {
    return (
      <View
        sx={{
          marginTop: WINDOW_HEIGHT * 0.15,
          justifyContent: 'center',
          alignItems: 'center'
        }}>
        {isAllBalancesInaccurate ? (
          <ErrorState onPress={refetch} />
        ) : (
          <EmptyAssets />
        )}
      </View>
    )
  }

  return <TokensList tokens={nonNftTokens} />
}

export default PortfolioAssetsScreen
