import { PriceChangeStatus, useTheme, View } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { useFormatCurrency } from 'common/hooks/useFormatCurrency'
import {
  findNftToken,
  isCollectibleTransaction,
  isInputOnlyContractCall,
  isPotentiallySwap,
  resolveTxUserAddress
} from 'features/activity/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import { CollectibleFetchAndRender } from 'features/portfolio/collectibles/components/CollectibleFetchAndRender'
import React, { FC, useMemo } from 'react'
import { ActivityTransactionType, Transaction } from 'store/transaction'
import { useMarketTokenBySymbol } from 'common/hooks/useMarketTokenBySymbol'
import { selectActiveAccount } from 'store/account'
import { useSelector } from 'react-redux'
import { isTxSentFromAccount } from 'features/portfolio/utils'
import ActivityListItem from './ActivityListItem'
import { TokenActivityListItemTitle } from './TokenActivityListItemTitle'
import { TransactionTypeIcon } from './TransactionTypeIcon'

export const TokenActivityListItem: FC<Props> = ({
  tx,
  onPress,
  showSeparator
}) => {
  const {
    theme: { colors }
  } = useTheme()
  const { formatTokenInCurrency } = useFormatCurrency()
  const account = useSelector(selectActiveAccount)
  const { getNetwork } = useNetworks()
  const currentPrice = useMarketTokenBySymbol({
    symbol: tx.tokens[0]?.symbol
  })?.currentPrice

  const isFromAccount = useMemo(() => {
    return isTxSentFromAccount(tx.from, account)
  }, [account, tx.from])

  const status = useMemo(() => {
    switch (tx.txType) {
      case TransactionType.TRANSFER:
        return PriceChangeStatus.Neutral
      case TransactionType.SEND:
        return PriceChangeStatus.Down
      case TransactionType.RECEIVE:
        return PriceChangeStatus.Up
      case TransactionType.SWAP: {
        if (tx.isIncoming) {
          return PriceChangeStatus.Up
        }
        if (tx.isOutgoing) {
          return PriceChangeStatus.Down
        }
        if (tx.tokens.length === 1) {
          return PriceChangeStatus.Down
        }

        return PriceChangeStatus.Up
      }
      default: {
        if (isCollectibleTransaction(tx)) {
          return PriceChangeStatus.Neutral
        }
        if (tx.isContractCall) {
          return tx.isSender || isFromAccount
            ? PriceChangeStatus.Down
            : PriceChangeStatus.Up
        }
        return PriceChangeStatus.Neutral
      }
    }
  }, [isFromAccount, tx])

  const subtitle = useMemo(() => {
    if (isCollectibleTransaction(tx)) {
      // No fallback to tokens[0] — when the tx is NFT-classified but lacks an
      // NFT leg, surfacing a NATIVE/ERC20 token's type (e.g. "NATIVE") as the
      // subtitle would be misleading. Drop the subtitle instead.
      const nftToken = findNftToken(tx)
      const tokenId = nftToken?.collectableTokenId
      const type = nftToken?.type

      // Avoid showing "#?"-style placeholders when fields are missing — drop
      // the subtitle entirely instead of surfacing meaningless data.
      if (tokenId && type) return `#${tokenId} - ${type}`
      if (tokenId) return `#${tokenId}`
      if (type) return type
      return null
    }

    if (tx.txType === TransactionType.TRANSFER) {
      return `${tx.tokens[0]?.name}`
    }

    const amount = Number(tx.tokens[0]?.amount.replaceAll(',', ''))
    if (!currentPrice || isNaN(amount)) {
      return null
    }
    const amountInCurrency = amount * currentPrice

    const formattedAmount = formatTokenInCurrency({
      amount: amountInCurrency
    })
    const amountPrefix =
      status === PriceChangeStatus.Up
        ? '+'
        : status === PriceChangeStatus.Down
        ? '-'
        : ''
    return amountPrefix + formattedAmount
  }, [tx, currentPrice, formatTokenInCurrency, status])

  const renderIcon = useMemo(() => {
    if (isCollectibleTransaction(tx)) {
      return (
        <CollectibleFetchAndRender tx={tx} size={ICON_SIZE} iconSize={20} />
      )
    }

    const userAddress = resolveTxUserAddress(
      tx,
      account,
      getNetwork(Number(tx.chainId))
    )
    const txType = fixUnknownTxType(tx, !!isFromAccount, userAddress)

    return (
      <View
        sx={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: ICON_SIZE,
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundColor: colors.$borderPrimary,
          borderColor: colors.$borderPrimary
        }}>
        <TransactionTypeIcon
          txType={txType}
          isContractCall={tx.isContractCall}
        />
      </View>
    )
  }, [tx, isFromAccount, colors.$borderPrimary, account, getNetwork])

  return (
    <ActivityListItem
      testID={`tx__from_${tx.from.toLowerCase()}_to_${tx.to.toLowerCase()}`}
      title={<TokenActivityListItemTitle tx={tx} />}
      subtitle={subtitle}
      subtitleType="amountInCurrency"
      timestamp={tx.timestamp}
      showSeparator={showSeparator}
      icon={renderIcon}
      onPress={onPress}
      status={status}
    />
  )
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export function fixUnknownTxType(
  tx: Transaction,
  isFromAccount: boolean,
  userAddress?: string
): ActivityTransactionType {
  if (tx?.txType === TransactionType.UNKNOWN) {
    // An input-only contract call (a leg leaves the user with nothing coming
    // back) is not a swap — it's an ERC-20 approval, a cross-chain output leg,
    // etc. Leaving it UNKNOWN makes the row show the Contract Call icon (via
    // the isContractCall fallback in TransactionTypeIcon) and keeps it out of
    // the Swap filter, matching the "Contract Call" title.
    const contractCall = isInputOnlyContractCall(tx.tokens, userAddress)
    // if the tx has 3 tokens, it means we funded the gas
    if (tx.tokens.length > 2) {
      // if all the tokens have the same symbol, it's a send/receive
      if (
        tx.tokens[0]?.symbol === tx.tokens[1]?.symbol &&
        tx.tokens[1]?.symbol === tx.tokens[2]?.symbol
      ) {
        return tx.isSender || isFromAccount
          ? TransactionType.SEND
          : TransactionType.RECEIVE
      }
      return contractCall ? TransactionType.UNKNOWN : TransactionType.SWAP
    }
    if (tx.tokens.length > 1) {
      if (tx.tokens[0]?.symbol === tx.tokens[1]?.symbol) {
        return tx.isSender || isFromAccount
          ? TransactionType.SEND
          : TransactionType.RECEIVE
      }
      return contractCall ? TransactionType.UNKNOWN : TransactionType.SWAP
    }
    if (tx.tokens.length === 1) {
      if (isPotentiallySwap(tx)) {
        return contractCall ? TransactionType.UNKNOWN : TransactionType.SWAP
      }
      return tx.isSender || isFromAccount
        ? TransactionType.SEND
        : TransactionType.RECEIVE
    }
  }
  return tx.txType as ActivityTransactionType
}

const ICON_SIZE = 36

export type TokenActivityTransaction = Omit<Transaction, 'txType'> & {
  txType: ActivityTransactionType
}

type Props = {
  tx: TokenActivityTransaction
  index: number
  onPress?: () => void
  showSeparator: boolean
}
