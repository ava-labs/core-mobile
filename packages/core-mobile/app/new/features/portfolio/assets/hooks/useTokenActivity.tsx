import { Image } from '@avalabs/k2-alpine'
import { DropdownGroup } from 'common/components/DropdownMenu'
import { DropdownSelection } from 'common/types'
import { ErrorState } from 'common/components/ErrorState'
import { LoadingState } from 'common/components/LoadingState'
import { useLowValueFilteredActivityTransactions } from 'features/activity/hooks/useLowValueFilteredActivityTransactions'
import {
  ActivityListItem,
  buildGroupedData,
  getDateGroups,
  isCollectibleTransaction,
  isSupportedNftChainId,
  resolveTxUserAddress,
  transactionInvolvesTokenSymbol
} from 'features/activity/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import { isEthereumChainId } from 'services/network/utils/isEthereumNetwork'
import { selectActiveAccount } from 'store/account/slice'
import { LocalTokenWithBalance } from 'store/balance'
import { useGetRecentTransactions } from 'store/transaction'
import { isPChain } from 'utils/network/isAvalancheNetwork'
import { isSolanaChainId } from 'utils/network/isSolanaNetwork'
import {
  TOKEN_DETAIL_FILTERS,
  TokenDetailFilter,
  useTokenDetailFilterAndSort
} from './useTokenDetailFilterAndSort'

const viewInExplorerIcon = require('../../../../assets/icons/flashlight.png')
const errorIcon = require('../../../../assets/icons/unamused_emoji.png')

type Params = {
  token?: LocalTokenWithBalance
  handleExplorerLink: (
    explorerLink: string,
    hash?: string,
    hashType?: 'account' | 'tx'
  ) => void
}

export type TokenActivity = {
  combinedData: ActivityListItem[]
  filter: DropdownSelection
  sort: DropdownSelection
  isLoading: boolean
  isError: boolean
  isRefreshing: boolean
  refresh: () => void
  renderEmptyState: () => React.ReactNode
}

export const useTokenActivity = ({
  token,
  handleExplorerLink
}: Params): TokenActivity => {
  const { getNetwork } = useNetworks()
  const account = useSelector(selectActiveAccount)

  const isSolanaNetwork =
    token?.networkChainId && isSolanaChainId(token.networkChainId)

  const network = useMemo(() => {
    return getNetwork(token?.networkChainId)
  }, [token?.networkChainId, getNetwork])

  const { transactions, refresh, isLoading, isRefreshing, isError } =
    useGetRecentTransactions(network)

  const transactionsBySymbol = useMemo(() => {
    return transactions.filter(tx => {
      if (
        isCollectibleTransaction(tx) &&
        isTokenCollectibleSupported(Number(tx.chainId), token?.symbol ?? '')
      ) {
        return true
      }
      if (!token?.symbol) {
        return true
      }
      return transactionInvolvesTokenSymbol({
        tokens: tx.tokens,
        tokenSymbol: token.symbol,
        userAddress: resolveTxUserAddress(tx, account, network),
        networkTokenSymbol: network?.networkToken?.symbol
      })
    })
  }, [token?.symbol, transactions, account, network])

  const lowValueFilteredTransactions = useLowValueFilteredActivityTransactions(
    transactionsBySymbol,
    network
  )

  const filters: DropdownGroup[] | undefined = useMemo(() => {
    if (token?.networkChainId) {
      const newFilters = [...(TOKEN_DETAIL_FILTERS[0]?.items ?? [])]
      if (isPChain(token?.networkChainId)) {
        newFilters.push({
          id: TokenDetailFilter.Stake,
          title: TokenDetailFilter.Stake
        })
      }
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
    transactions: lowValueFilteredTransactions,
    filters
  })

  const combinedData = useMemo(() => {
    const { todayTxs, monthGroups } = getDateGroups(data)
    return buildGroupedData(todayTxs, monthGroups)
  }, [data])

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return <LoadingState />
    }
    if (isError) {
      return (
        <ErrorState
          description="Please hit refresh or try again later"
          button={{ title: 'Refresh', onPress: refresh }}
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

  return {
    combinedData,
    filter,
    sort,
    isLoading,
    isError: Boolean(isError),
    isRefreshing,
    refresh,
    renderEmptyState
  }
}

function isTokenCollectibleSupported(chainId: number, symbol: string): boolean {
  return (
    (isAvalancheCChainId(chainId) && symbol === 'AVAX') ||
    (isEthereumChainId(chainId) && symbol === 'ETH')
  )
}
