import { Text, useTheme, View } from '@avalabs/k2-alpine'
import { TokenType, TransactionType, TxToken } from '@avalabs/vm-module-types'
import { HiddenBalanceText } from 'common/components/HiddenBalanceText'
import { SubTextNumber } from 'common/components/SubTextNumber'
import { useBlockchainNames } from 'common/utils/useBlockchainNames'
import { UNKNOWN_AMOUNT } from 'consts/amount'
import {
  findNftToken,
  isCollectibleTransaction,
  isPotentiallySwap
} from 'features/activity/utils'
import { useNetworks } from 'hooks/networks/useNetworks'
import React, { ReactNode, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Account, selectActiveAccount } from 'store/account'
import { getAddressByNetwork } from 'store/account/utils'
import { selectIsPrivacyModeEnabled } from 'store/settings/securityPrivacy'
import Logger from 'utils/Logger'
import { isTxSentFromAccount } from 'features/portfolio/utils'
import { TokenActivityTransaction } from './TokenActivityListItem'

const isPaymentTokenType = (token: TxToken | undefined): boolean =>
  token?.type === TokenType.NATIVE || token?.type === TokenType.ERC20

// Determines whether the active user ended up holding the NFT after the tx.
// Prefers NFT-leg from/to addresses; falls back to top-level tx flags when
// the NFT entry omits them (some Glacier responses do).
const resolveUserIsRecipient = ({
  nftToken,
  userAddressLower,
  transaction,
  account
}: {
  nftToken: TxToken | undefined
  userAddressLower: string | undefined
  transaction: TokenActivityTransaction
  account: Account | undefined
}): boolean => {
  const nftFromLower = nftToken?.from?.address?.toLowerCase()
  const nftToLower = nftToken?.to?.address?.toLowerCase()

  if (nftToLower && nftToLower === userAddressLower) return true
  if (nftFromLower && nftFromLower === userAddressLower) return false

  return !(
    transaction.isSender || isTxSentFromAccount(transaction.from, account)
  )
}

// Picks a NATIVE/ERC20 leg matching the user's direction (payment leaves the
// user on a buy, lands at the user on a sell). When direction-based matching
// fails (some Glacier responses omit `from`/`to`), only fall back if there is
// a single unambiguous payment token — multiple payment legs without
// direction info could mislead (e.g. royalty/fee legs vs. seller payout).
const findPaymentToken = (
  tokens: TxToken[],
  userIsRecipient: boolean,
  userAddressLower: string | undefined
): TxToken | undefined => {
  const matchesUserDirection = (token: TxToken): boolean => {
    const addr = (
      userIsRecipient ? token.from?.address : token.to?.address
    )?.toLowerCase()
    return Boolean(addr) && addr === userAddressLower
  }

  const directional = tokens.find(
    t => isPaymentTokenType(t) && matchesUserDirection(t)
  )
  if (directional) return directional

  const payments = tokens.filter(isPaymentTokenType)
  return payments.length === 1 ? payments[0] : undefined
}

// Composes a human-readable label for the NFT in the title. Uses whichever
// of `name`/`symbol` are populated and falls back to "NFT" when both are
// missing. Applies to both ERC721 and ERC1155 — ERC1155 collections like
// game assets often carry meaningful names worth surfacing.
const getNftLabel = (nftToken: TxToken | undefined): string => {
  const name = nftToken?.name?.trim()
  const symbol = nftToken?.symbol?.trim()

  // Avoid redundant "Name (SYMBOL)" when name and symbol are effectively
  // identical (case-insensitive) — common for ERC1155 game assets where
  // both fields carry the same string.
  if (name && symbol && name.toLowerCase() !== symbol.toLowerCase()) {
    return `${name} (${symbol})`
  }
  if (name) return name
  if (symbol) return symbol
  return 'NFT'
}

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
    // eslint-disable-next-line sonarjs/cognitive-complexity
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

      // If input is known but output is not visible (e.g. cross-chain swap where
      // the destination token lands on a different chain), show just the input.
      if (inputTokens.length > 0 && outputTokens.length === 0) {
        const inputToken = inputTokens[0]
        if (inputToken) {
          return [
            renderAmount(inputToken.amount),
            ' ',
            inputToken.symbol,
            ' swapped'
          ]
        }
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
      const nftToken = findNftToken(transaction) ?? transaction.tokens[0]
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
        return [
          `${nftLabel} ${action} for `,
          renderAmount(paymentToken.amount),
          ' ',
          paymentToken.symbol
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
