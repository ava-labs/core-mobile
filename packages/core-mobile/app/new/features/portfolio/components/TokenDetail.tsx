import { alpha, FlatList, useTheme, View } from '@avalabs/k2-alpine'
import { TokenHeader } from 'common/components/TokenHeader'
import React, { FC, memo, useCallback, useMemo } from 'react'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import {
  ActionButton,
  ActionButtons
} from 'features/portfolio/components/ActionButtons'
import { ListFilterHeader } from 'features/portfolio/components/ListFilterHeader'
import { LoadingState } from 'features/portfolio/components/assets/LoadingState'
import { ErrorState } from 'features/portfolio/components/assets/ErrorState'
import { Transaction } from 'store/transaction'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { TxHistoryEmptyState } from 'features/portfolio/components/TxHistoryEmptyState'
import { RefreshControl } from 'common/components/RefreshControl'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { TokenType } from '@avalabs/vm-module-types'
import { DropdownSelection } from './assets/useTokenDetailFilterAndSort'
import { XpActivityListItem } from './assets/XpActivityListItem'
import { NftActivityListItem } from './assets/NftActivityListItem'
import { TokenActivityListItem } from './assets/TokenActivityListItem'

interface Props {
  onScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ) => void
  animatedHeaderStyle: ReturnType<typeof useAnimatedStyle>
  formattedBalance: string
  handleBalanceHeaderLayout: (event: LayoutChangeEvent) => void
  data: Transaction[]
  filter: DropdownSelection
  sort: DropdownSelection
  actionButtons: ActionButton[]
  token?: LocalTokenWithBalance
  handleExplorerLink: (explorerLink: string) => void
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  refresh: () => void
  isBalanceLoading: boolean
  isBalanceAccurate: boolean
  selectedCurrency: string
}

const TokenDetail: FC<Props> = ({
  data,
  filter,
  sort,
  onScroll,
  animatedHeaderStyle,
  formattedBalance,
  actionButtons,
  handleBalanceHeaderLayout,
  handleExplorerLink,
  token,
  isLoading,
  isBalanceLoading,
  isBalanceAccurate,
  isRefreshing,
  selectedCurrency,
  isError,
  refresh
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()

  const renderHeader = useCallback((): JSX.Element => {
    return (
      <View
        style={{
          backgroundColor: colors.$surfacePrimary,
          paddingHorizontal: 16
        }}>
        <View onLayout={handleBalanceHeaderLayout}>
          <Animated.View
            style={[
              {
                paddingBottom: 16,
                backgroundColor: colors.$surfacePrimary
              },
              animatedHeaderStyle
            ]}>
            <TokenHeader
              token={token}
              formattedBalance={formattedBalance}
              currency={selectedCurrency}
              errorMessage={
                isBalanceAccurate ? undefined : 'Unable to load all balances'
              }
              isLoading={isBalanceLoading}
            />
          </Animated.View>
        </View>
        <ActionButtons buttons={actionButtons} />
      </View>
    )
  }, [
    actionButtons,
    animatedHeaderStyle,
    colors.$surfacePrimary,
    formattedBalance,
    handleBalanceHeaderLayout,
    isBalanceAccurate,
    isBalanceLoading,
    selectedCurrency,
    token
  ])

  const header = useMemo(() => {
    return (
      <>
        {renderHeader()}
        <ListFilterHeader
          filter={filter}
          sort={sort}
          sx={{ paddingHorizontal: 16 }}
        />
      </>
    )
  }, [filter, renderHeader, sort])

  const emptyState = useMemo(() => {
    if (isLoading || isRefreshing) {
      return <LoadingState />
    }

    if (isError) {
      return <ErrorState onPress={refresh} />
    }

    if (data.length === 0) {
      return <TxHistoryEmptyState />
    }
  }, [isError, isLoading, isRefreshing, data, refresh])

  const renderItem = (item: Transaction, index: number): React.JSX.Element => {
    const isLastItem = data.length - 1 === index
    const isNft =
      item.tokens[0]?.type === TokenType.ERC1155 ||
      item.tokens[0]?.type === TokenType.ERC721
    const isXpTx =
      isXpTransaction(item.txType) &&
      (token?.localId === AVAX_P_ID || token?.localId === AVAX_X_ID)

    const props = {
      tx: item,
      isLastItem,
      index,
      onPress: () => handleExplorerLink(item.explorerLink)
    }

    if (isXpTx) {
      return <XpActivityListItem {...props} key={item.hash} />
    }
    if (isNft) {
      return <NftActivityListItem {...props} key={item.hash} />
    }
    return <TokenActivityListItem {...props} key={item.hash} />
  }

  return (
    <BlurredBarsContentLayout>
      <FlatList
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl onRefresh={refresh} refreshing={isRefreshing} />
        }
        contentContainerStyle={{
          overflow: 'visible',
          paddingBottom: 26
        }}
        data={data}
        renderItem={item => renderItem(item.item as Transaction, item.index)}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={false}
      />
      <View
        sx={{
          marginBottom: -1
        }}>
        <LinearGradient
          colors={[
            alpha(colors.$surfacePrimary, 0),
            alpha(colors.$surfacePrimary, 0.9)
          ]}
          style={{
            position: 'absolute',
            top: -44,
            left: 0,
            right: 0,
            height: 60
          }}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />
      </View>
    </BlurredBarsContentLayout>
  )
}

export default memo(TokenDetail)
