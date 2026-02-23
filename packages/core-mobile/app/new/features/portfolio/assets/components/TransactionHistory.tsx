import { BridgeTransfer } from '@avalabs/bridge-unified'
import { BridgeTransaction } from '@avalabs/core-bridge-sdk'
import { Image } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { CollapsibleTabs } from 'common/components/CollapsibleTabs'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DropdownSelections } from 'common/components/DropdownSelections'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { getBridgeAssetSymbol } from 'common/utils/bridgeUtils'
import { ActivityList } from 'features/activity/components/ActivityList'
import {
  buildGroupedData,
  getDateGroups,
  isCollectibleTransaction,
  isSupportedNftChainId
} from 'features/activity/utils'
import usePendingBridgeTransactions from 'features/bridge/hooks/usePendingBridgeTransactions'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { FC, useCallback, useMemo } from 'react'
import { Platform, ViewStyle } from 'react-native'
import { useHeaderMeasurements } from 'react-native-collapsible-tab-view'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { selectActiveAccount } from 'store/account/slice'
import { LocalTokenWithBalance } from 'store/balance'
import { Transaction, useGetRecentTransactions } from 'store/transaction'
import { isPChain } from 'utils/network/isAvalancheNetwork'
import { isSolanaChainId } from 'utils/network/isSolanaNetwork'
import {
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  useTokenDetailFilterAndSort
} from '../hooks/useTokenDetailFilterAndSort'

const viewInExplorerIcon = require('../../../../assets/icons/flashlight.png')
const errorIcon = require('../../../../assets/icons/unamused_emoji.png')

interface Props {
  token?: LocalTokenWithBalance
  containerStyle: ViewStyle
  handleExplorerLink: (
    explorerLink: string,
    hash?: string,
    hashType?: 'account' | 'tx'
  ) => void
  handlePendingBridge: (transaction: BridgeTransaction | BridgeTransfer) => void
}

const TransactionHistory: FC<Props> = ({
  token,
  handleExplorerLink,
  handlePendingBridge,
  containerStyle
}): React.JSX.Element => {
  const header = useHeaderMeasurements()
  const { getNetwork } = useNetworks()
  const account = useSelector(selectActiveAccount)

  const isSolanaNetwork =
    token?.networkChainId && isSolanaChainId(token.networkChainId)

  const network = useMemo(() => {
    return getNetwork(token?.networkChainId)
  }, [token, getNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const pendingBridgeTxs = usePendingBridgeTransactions(token?.networkChainId)
  const isPendingBridge = useCallback(
    (tx: Transaction) => {
      return (
        tx.txType === TransactionType.BRIDGE &&
        pendingBridgeTxs.some(
          bridge =>
            (bridge.sourceTxHash === tx.hash ||
              (!!bridge.targetTxHash && bridge.targetTxHash === tx.hash)) &&
            Boolean(bridge.completedAt) === false
        )
      )
    },
    [pendingBridgeTxs]
  )
  const transactionsBySymbol = useMemo(() => {
    return transactions
      .filter(tx => {
        // Filter collectible transactions that support collectible transactions
        if (
          isCollectibleTransaction(tx) &&
          isTokenCollectibleSupported(Number(tx.chainId), token?.symbol ?? '')
        ) {
          return true
        }

        return (
          !token?.symbol ||
          (tx.tokens[0]?.symbol && token.symbol === tx.tokens[0].symbol) ||
          (tx.tokens[1]?.symbol && token.symbol === tx.tokens[1].symbol)
        )
      })
      .filter(tx => !isPendingBridge(tx))
  }, [token, transactions, isPendingBridge])

  const filters: DropdownGroup[] | undefined = useMemo(() => {
    if (token?.networkChainId) {
      const newFilters = [...(TOKEN_DETAIL_FILTERS[0]?.items ?? [])]
      // Stake filter is only available for P-Chain
      if (isPChain(token?.networkChainId)) {
        newFilters.push({
          id: TokenDetailFilter.Stake,
          title: TokenDetailFilter.Stake
        })
      }

      // Only Avalanche C-Chain and Ethereum are supported for NFTs
      if (
        isSupportedNftChainId(token?.networkChainId) &&
        isTokenCollectibleSupported(
          Number(token?.networkChainId),
          token?.symbol ?? ''
        )
      ) {
        newFilters.push({
          id: TokenDetailFilter.NFT,
          title: TokenDetailFilter.NFT
        })
      }
      return [
        {
          key: 'token-detail-filters',
          items: newFilters
        }
      ]
    }
  }, [token?.networkChainId, token?.symbol])

  const { data, filter, sort } = useTokenDetailFilterAndSort({
    transactions: transactionsBySymbol,
    filters
  })

  const combinedData = useMemo(() => {
    const filteredPendingBridgeTxs = pendingBridgeTxs
      .toSorted((a, b) => b.sourceStartedAt - a.sourceStartedAt)
      .filter(tx => getBridgeAssetSymbol(tx) === token?.symbol)

    const { todayTxs, monthGroups } = getDateGroups(data)
    return buildGroupedData(todayTxs, monthGroups, filteredPendingBridgeTxs)
  }, [data, pendingBridgeTxs, token?.symbol])

  const renderEmptyComponent = useCallback(() => {
    if (isLoading) {
      return <LoadingState />
    }

    if (isError) {
      return (
        <ErrorState
          description="Please hit refresh or try again later"
          button={{
            title: 'Refresh',
            onPress: refresh
          }}
        />
      )
    }

    if (isSolanaNetwork) {
      return (
        <ErrorState
          icon={
            <Image source={viewInExplorerIcon} sx={{ width: 42, height: 42 }} />
          }
          title={`View transaction\ndetails in the Explorer`}
          description="Visit the Explorer for more info"
          button={{
            title: 'View in Explorer',
            onPress: () =>
              handleExplorerLink(
                network?.explorerUrl ?? '',
                account?.addressSVM,
                'account'
              )
          }}
        />
      )
    }

    return (
      <ErrorState
        icon={<Image source={errorIcon} sx={{ width: 42, height: 42 }} />}
        title="No recent transactions"
        description="Interact with this token onchain and see your activity here"
      />
    )
  }, [
    account?.addressSVM,
    handleExplorerLink,
    isError,
    isLoading,
    isSolanaNetwork,
    network?.explorerUrl,
    refresh
  ])

  const renderEmpty = useCallback(() => {
    return (
      <CollapsibleTabs.ContentWrapper>
        {renderEmptyComponent()}
      </CollapsibleTabs.ContentWrapper>
    )
  }, [renderEmptyComponent])

  const renderHeader = useCallback(() => {
    return (
      <DropdownSelections
        filter={filter}
        sort={sort}
        sx={{ paddingHorizontal: 16, paddingTop: 10 }}
      />
    )
  }, [filter, sort])

  const overrideProps = {
    contentContainerStyle: {
      overflow: 'visible',
      paddingBottom: 16,
      paddingTop: Platform.OS === 'android' ? header.height : 0,
      ...containerStyle
    }
  }

  return (
    <Animated.View
      entering={getListItemEnteringAnimation(0)}
      style={{
        flex: 1
      }}>
      <ActivityList
        data={combinedData}
        xpToken={token}
        handlePendingBridge={handlePendingBridge}
        handleExplorerLink={handleExplorerLink}
        overrideProps={overrideProps}
        renderHeader={renderHeader}
        renderEmpty={renderEmpty}
        isRefreshing={isRefreshing}
        refresh={refresh}
      />
    </Animated.View>
  )
}

export default TransactionHistory

function isTokenCollectibleSupported(chainId: number, symbol: string): boolean {
  return (
    (isAvalancheCChainId(chainId) && symbol === 'AVAX') ||
    (isEthereumChainId(chainId) && symbol === 'ETH')
  )
}
