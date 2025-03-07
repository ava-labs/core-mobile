import { FlatList, Image, Separator } from '@avalabs/k2-alpine'
import React, { FC, useCallback, useMemo } from 'react'
import { LocalTokenWithBalance } from 'store/balance'
import { Transaction } from 'store/transaction'
import BlurredBarsContentLayout from 'common/components/BlurredBarsContentLayout'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { RefreshControl } from 'common/components/RefreshControl'
import { isXpTransaction } from 'common/utils/isXpTransactions'
import { DropdownSelection } from 'common/types'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import {
  isXpLocalId,
  portfolioTabContentHeight
} from 'features/portfolio/utils'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { XpActivityListItem } from './XpActivityListItem'
import { TokenActivityListItem } from './TokenActivityListItem'

interface Props {
  data: Transaction[]
  filter: DropdownSelection
  sort: DropdownSelection
  onScroll: (
    event: NativeSyntheticEvent<NativeScrollEvent> | NativeScrollEvent | number
  ) => void
  token?: LocalTokenWithBalance
  handleExplorerLink: (explorerLink: string) => void
  isLoading: boolean
  isRefreshing: boolean
  isError: boolean
  refresh: () => void
}

const TokenDetail: FC<Props> = ({
  data,
  filter,
  sort,
  onScroll,
  handleExplorerLink,
  token,
  isLoading,
  isRefreshing,
  isError,
  refresh
}): React.JSX.Element => {
  const dropdowns = useMemo(() => {
    return (
      <DropdownSelections
        filter={filter}
        sort={sort}
        sx={{ paddingHorizontal: 16 }}
      />
    )
  }, [filter, sort])

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
      const isXpTx = isXpTransaction(item.txType) && isXpLocalId(token?.localId)

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
        ListHeaderComponent={data.length > 0 ? dropdowns : undefined}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={renderSeparator}
      />
    </BlurredBarsContentLayout>
  )
}

export default TokenDetail
