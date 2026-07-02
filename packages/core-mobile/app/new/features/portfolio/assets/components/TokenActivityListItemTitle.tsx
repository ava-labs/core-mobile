import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TransactionType } from '@avalabs/vm-module-types'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import {
  findNftToken,
  findPaymentToken,
  getNftLabel,
  isCollectibleTransaction,
  isPotentiallySwap,
  resolvePaymentSymbol,
  resolveUserIsRecipient,
  selectSwapTokens
} from 'features/activity/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { isTxSentFromAccount } from 'features/portfolio/utils'
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

  const isFromAccount = useMemo(() => {
    return isTxSentFromAccount(tx.from, activeAccount)
  }, [activeAccount, tx.from])

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
            fontFamily="Inter-SemiBold"
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

      // For swap transactions, we need to identify the user's actual input and
      // output tokens. Get the current user's address for the specific network
      // from the Redux store, then resolve the input/output legs.
      // `selectSwapTokens` prefers the non-native input leg so a token→token
      // swap that also carries a native protocol/gas-fee leg (e.g. recurring
      // fills) is labelled by the ERC-20 principal, not the small native fee.
      const network = getNetwork(Number(transaction.chainId))
      const userAddress =
        network && activeAccount
          ? getAddressByNetwork(activeAccount, network)
          : transaction.from

      const { inputToken, outputToken } = selectSwapTokens(
        transaction.tokens,
        userAddress
      )

      // If we can identify both input and output tokens, use them.
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

      // Input known, no output leg to the user. Two very different txs land
      // here and are indistinguishable by their token legs alone:
      //   • a cross-chain swap whose output token lands on another chain
      //   • an unclassified contract call with a single leg — e.g. an ERC-20
      //     approval, whose Approval event the indexer surfaces as a
      //     user→spender token with no return.
      // The indexer classifies genuine swaps as `txType === SWAP`, so only
      // trust the "swapped" label there. Otherwise (`UNKNOWN` etc.) `method`
      // and `txType` give us nothing to prove a swap or an approval, so fall
      // back to a neutral "Contract Call" rather than fabricating either.
      if (inputToken) {
        if (transaction.txType === TransactionType.SWAP) {
          return [
            renderAmount(inputToken.amount),
            ' ',
            inputToken.symbol,
            ' swapped'
          ]
        }
        // Keep the leg amount + symbol so the row still conveys what moved
        // (e.g. "10 USDC Contract Call"), matching the "10 USDC sent" style
        // of the other single-leg labels.
        return [
          renderAmount(inputToken.amount),
          ' ',
          inputToken.symbol,
          ' Contract Call'
        ]
      }

      // fallback to original logic if we can't identify input and output tokens
      const { a1, a2, s1, s2 } = getIOTokenAmountAndSymbol()

      if (tx.tokens.length === 1) {
        // Avoid "X swapped for X" when s2 falls back to the same network token symbol
        if (s1 === s2) {
          return [renderAmount(a1), ' ', s1, ' swapped']
        }
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

  // Title for NFT-related transactions. Distinguishes marketplace
  // purchases/sales (NFT + NATIVE/ERC20 leg) from plain transfers, and
  // includes the payment amount when present.
  const getCollectibleTitle = useCallback(
    (transaction: TokenActivityTransaction): ReactNode[] => {
      // `nftToken` may be undefined when an NFT_* tx lacks an ERC721/ERC1155
      // leg; downstream helpers (`getNftLabel`, `resolveUserIsRecipient`)
      // tolerate undefined and we render the generic "NFT" label.
      const nftToken = findNftToken(transaction)
      const network = getNetwork(Number(transaction.chainId))
      const userAddress =
        network && activeAccount
          ? getAddressByNetwork(activeAccount, network)
          : transaction.from
      const userAddressLower = userAddress?.toLowerCase()

      const userIsRecipient = resolveUserIsRecipient({
        nftToken,
        userAddressLower,
        transaction,
        account: activeAccount
      })
      const paymentToken = findPaymentToken(
        transaction.tokens,
        userIsRecipient,
        userAddressLower
      )
      const nftLabel = getNftLabel(nftToken)

      if (paymentToken) {
        const action = userIsRecipient ? 'bought' : 'sold'
        const paymentSymbol = resolvePaymentSymbol(
          paymentToken,
          network?.networkToken.symbol
        )
        return [
          `${nftLabel} ${action} for `,
          renderAmount(paymentToken.amount),
          ' ',
          paymentSymbol
        ]
      }

      const action = userIsRecipient ? 'received' : 'sent'
      return [`${nftLabel} ${action}`]
    },
    [activeAccount, getNetwork, renderAmount]
  )

  // Build an array of nodes: strings and React elements
  // eslint-disable-next-line sonarjs/cognitive-complexity
  const nodes = useMemo<ReactNode[]>(() => {
    const { a1, s1 } = getIOTokenAmountAndSymbol()

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
          return getCollectibleTitle(tx)
        }
        if (tx.isContractCall) {
          // if the tx has 3 tokens, it means we funded the gas
          if (tx.tokens.length > 2) {
            // if all the tokens have the same symbol, it's a send/receive
            if (
              tx.tokens[0]?.symbol === tx.tokens[1]?.symbol &&
              tx.tokens[1]?.symbol === tx.tokens[2]?.symbol
            ) {
              return [
                renderAmount(a1),
                ' ',
                s1,
                tx.isSender || isFromAccount ? ' sent' : ' received'
              ]
            }

            return getSwapTitle(tx)
          }

          if (tx.tokens.length > 1) {
            if (tx.tokens[0]?.symbol === tx.tokens[1]?.symbol) {
              return [
                renderAmount(a1),
                ' ',
                s1,
                tx.isSender || isFromAccount ? ' sent' : ' received'
              ]
            }

            return getSwapTitle(tx)
          }

          if (tx.tokens.length === 1) {
            if (isPotentiallySwap(tx)) {
              return getSwapTitle(tx)
            }

            return [
              renderAmount(a1),
              ' ',
              s1,
              tx.isSender || isFromAccount ? ' sent' : ' received'
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
    getCollectibleTitle,
    renderAmount,
    sourceBlockchain,
    targetBlockchain,
    isFromAccount
  ])

  const titleLabel = useMemo(() => {
    return nodes
      .map(node => {
        if (typeof node === 'string') return node
        if (React.isValidElement(node)) {
          const props = node.props as { number?: number | string }
          if (props.number !== undefined) return String(props.number)
        }
        return ''
      })
      .join('')
  }, [nodes])

  return (
    <View
      testID={`tx__title__${titleLabel}`}
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
