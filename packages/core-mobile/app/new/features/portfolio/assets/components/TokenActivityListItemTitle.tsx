import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType, TransactionType } from '@avalabs/vm-module-types'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import {
  isCollectibleTransaction,
  isPotentiallySwap
} from 'features/activity/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import Logger from 'utils/Logger'
import { TokenActivityTransaction } from './TokenActivityListItem'

export const TokenActivityListItemTitle = ({
  tx
}: {
  tx: TokenActivityTransaction
}): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { sourceBlockchain, targetBlockchain } = useBlockchainNames(tx)
  const isPrivacyModeEnabled = useSelector(selectIsPrivacyModeEnabled)
  const activeAccount = useSelector(selectActiveAccount)
  const textVariant = 'buttonMedium'
  const { getNetwork } = useNetworks()

  const renderAmount = useCallback(
    (amount?: string): ReactNode => {
      if (isPrivacyModeEnabled) {
        return <HiddenBalanceText variant={textVariant} isCurrency={false} />
      }

      const num = Number(amount)
      if (!isNaN(num)) {
        return (
          <SubTextNumber
            key={`amt-${amount}`}
            number={num}
            textVariant={textVariant}
            textColor={colors.$textPrimary}
          />
        )
      }
      return amount ?? UNKNOWN_AMOUNT
    },
    [colors, isPrivacyModeEnabled]
  )

  const getIOTokenAmountAndSymbol = useCallback(() => {
    const a1 = tx.tokens[0]?.amount
    const a2 = tx.tokens[1]?.amount
    let s1 = tx.tokens[0]?.symbol
    let s2 = tx.tokens[1]?.symbol

    if (!s1) {
      s1 = tx.tokens[0]?.type
    }

    if (!s2) {
      const foundNetwork = getNetwork(Number(tx.chainId))
      s2 = foundNetwork?.networkToken.symbol
    }

    return {
      a1,
      a2,
      s1,
      s2
    }
  }, [tx, getNetwork])

  // Smart swap title generation that identifies input vs output tokens
  const getSwapTitle = useCallback(
    (transaction: TokenActivityTransaction): ReactNode[] => {
      // worst case scenario, just return 'Swap'
      if (!transaction.tokens || transaction.tokens.length === 0) {
        Logger.warn('No tokens found in swap transaction')
        return ['Swap']
      }

      // For swap transactions, we need to identify the user's actual input and output tokens
      // Get the current user's address for the specific network from Redux store
      const network = getNetwork(Number(transaction.chainId))
      const userAddress =
        network && activeAccount
          ? getAddressByNetwork(activeAccount, network)
          : transaction.from

      // Find tokens that are actually sent FROM the user (input tokens)
      // Note: For swaps, the user's wallet should be in transaction.from
      const inputTokens = transaction.tokens.filter(token => {
        return token.from?.address === userAddress
      })

      // Find tokens that are actually sent TO the user (output tokens)
      const outputTokens = transaction.tokens.filter(token => {
        return token.to?.address === userAddress
      })

      // If we can identify input and output tokens, use them
      if (inputTokens.length > 0 && outputTokens.length > 0) {
        const inputToken = inputTokens[0]
        const outputToken = outputTokens[0]

        if (inputToken && outputToken) {
          return [
            renderAmount(inputToken.amount),
            ' ',
            inputToken.symbol,
            ' swapped for ',
            renderAmount(outputToken.amount),
            ' ',
            outputToken.symbol
          ]
        }
      }

      // fallback to original logic if we can't identify input and output tokens
      const { a1, a2, s1, s2 } = getIOTokenAmountAndSymbol()

      if (tx.tokens.length === 1) {
        return [renderAmount(a1), ' ', s1, ' swapped for ', s2]
      }

      return [
        renderAmount(a1),
        ' ',
        s1,
        ' swapped for ',
        renderAmount(a2),
        ' ',
        s2
      ]
    },
    [
      activeAccount,
      getIOTokenAmountAndSymbol,
      getNetwork,
      renderAmount,
      tx.tokens.length
    ]
  )

  // Build an array of nodes: strings and React elements
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const nodes = useMemo<ReactNode[]>(() => {
    const { a1, a2, s1, s2 } = getIOTokenAmountAndSymbol()

    switch (tx.txType) {
      case TransactionType.BRIDGE:
        if (tx.tokens.length === 1) {
          return [
            renderAmount(a1),
            ' ',
            s1,
            ' ',
            sourceBlockchain ?? 'Unknown',
            ' → ',
            targetBlockchain ?? 'Unknown'
          ]
        }
        return ['Unknown']
      case TransactionType.SWAP:
        return getSwapTitle(tx)
      case TransactionType.SEND:
        return [renderAmount(a1), ' ', s1, ' sent']
      case TransactionType.RECEIVE:
        return [renderAmount(a1), ' ', s1, ' received']
      case TransactionType.TRANSFER:
        return [renderAmount(a1), ' ', s1, ' transferred']
      case TransactionType.APPROVE:
        return [renderAmount(a1), ' ', s1, ' approved']

      default: {
        if (isCollectibleTransaction(tx)) {
          if (tx.tokens[0]?.type === TokenType.ERC1155) {
            return [`NFT ${tx.isSender ? 'sent' : 'received'}`]
          }

          return [
            `${tx.tokens[0]?.name} (${tx?.tokens[0]?.symbol}) ${
              tx.isSender ? 'sent' : 'received'
            }`
          ]
        }
        if (tx.isContractCall) {
          // if the tx has 3 tokens, it means we funded the gas
          if (tx.tokens.length > 2) {
            const a3 = tx.tokens[2]?.amount
            const s3 = tx.tokens[2]?.symbol
            // if all the tokens have the same symbol, it's a send/receive
            if (
              tx.tokens[0]?.symbol === tx.tokens[1]?.symbol &&
              tx.tokens[1]?.symbol === tx.tokens[2]?.symbol
            ) {
              return [
                renderAmount(a1),
                ' ',
                s1,
                tx.isSender ? ' sent' : ' received'
              ]
            }

            return [
              renderAmount(a1),
              ' ',
              s1,
              ' swapped for ',
              renderAmount(a3),
              ' ',
              s3
            ]
          }

          if (tx.tokens.length > 1) {
            if (tx.tokens[0]?.symbol === tx.tokens[1]?.symbol) {
              return [
                renderAmount(a1),
                ' ',
                s1,
                tx.isSender ? ' sent' : ' received'
              ]
            }

            return [
              renderAmount(a1),
              ' ',
              s1,
              ' swapped for ',
              renderAmount(a2),
              ' ',
              s2
            ]
          }

          if (tx.tokens.length === 1) {
            if (isPotentiallySwap(tx)) {
              return [renderAmount(a1), ' ', s1, ' swapped for ', s2]
            }
            return [
              renderAmount(a1),
              ' ',
              s1,
              tx.isSender ? ' sent' : ' received'
            ]
          }

          return ['Contract Call']
        }
        return ['Unknown']
      }
    }
  }, [
    getIOTokenAmountAndSymbol,
    tx,
    getSwapTitle,
    renderAmount,
    sourceBlockchain,
    targetBlockchain
  ])

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        flexWrap: 'wrap'
      }}>
      {nodes.map((node, i) =>
        typeof node === 'string' ? (
          <Text
            key={`txt-${i}`}
            variant={textVariant}
            sx={{ color: colors.$textPrimary }}>
            {node}
          </Text>
        ) : React.isValidElement(node) ? (
          React.cloneElement(node, { key: `node-${i}` })
        ) : null
      )}
    </View>
  )
}
