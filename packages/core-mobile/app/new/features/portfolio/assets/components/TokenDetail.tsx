import { FlatList, Image, Separator, useTheme, View } from '@avalabs/k2-alpine'
import { TokenHeader } from 'common/components/TokenHeader'
import React, { FC, useCallback, useMemo } from 'react'
import { AVAX_P_ID, AVAX_X_ID, LocalTokenWithBalance } from 'store/balance'
import { Transaction } from 'store/transaction'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent
} from 'react-native'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { RefreshControl } from 'common/components/RefreshControl'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { DropdownSelection } from 'common/types'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { XpActivityListItem } from './XpActivityListItem'
import { TokenActivityListItem } from './TokenActivityListItem'
import { ActionButton, ActionButtons } from './ActionButtons'

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
        {data.length > 0 && (
          <DropdownSelections
            filter={filter}
            sort={sort}
            sx={{ paddingHorizontal: 16 }}
          />
        )}
      </>
    )
  }, [data.length, filter, renderHeader, sort])

  const emptyState = useMemo(() => {
    if (isLoading || isRefreshing) {
      return <LoadingState sx={{ height: portfolioTabContentHeight }} />
    }

    if (isError) {
      return (
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    return (
      <ErrorState
        sx={{ height: portfolioTabContentHeight }}
        icon={
          <Image
            source={require('../../../../assets/icons/unamused_emoji.png')}
            sx={{ width: 42, height: 42 }}
          />
        }
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [isError, isLoading, isRefreshing, refresh])

  const renderItem = useCallback(
    (item: Transaction, index: number): React.JSX.Element => {
      const isXpTx =
        isXpTransaction(item.txType) &&
        (token?.localId === AVAX_P_ID || token?.localId === AVAX_X_ID)

      const props = {
        tx: item,
        index,
        onPress: () => handleExplorerLink(item.explorerLink)
      }

      if (isXpTx) {
        return <XpActivityListItem {...props} key={item.hash} />
      }
      return <TokenActivityListItem {...props} key={item.hash} />
    },
    [handleExplorerLink, token]
  )

  const renderSeparator = (): JSX.Element => {
    return <Separator sx={{ marginLeft: 63 }} />
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
        ItemSeparatorComponent={renderSeparator}
      />
    </BlurredBarsContentLayout>
  )
}

export default TokenDetail
