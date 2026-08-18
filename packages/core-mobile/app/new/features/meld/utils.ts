import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { TokenVisibility } from 'store/portfolio'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { router } from 'expo-router'
import { getLocalTokenId } from 'services/balance/utils/getLocalTokenId'
import { ACTIONS } from '../../../contexts/DeeplinkContext/types'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  SOLANA_MELD_CHAIN_ID
} from './consts'
import {
  CreateCryptoQuoteNotFoundError,
  CreateCryptoQuoteError,
  CryptoCurrency,
  CryptoQuotesError,
  CreateCryptoQuoteErrorCode
} from './types'

export const asZeroBalanceToken = (
  token: NetworkContractToken
): LocalTokenWithBalance =>
  ({
    ...token,
    ...('chainId' in token && { networkChainId: token.chainId }),
    localId: getLocalTokenId(token),
    balance: 0n,
    balanceInCurrency: 0,
    balanceDisplayValue: '0',
    balanceCurrencyDisplayValue: '0',
    priceInCurrency: 0,
    marketCap: 0,
    change24: 0,
    vol24: 0
  } as LocalTokenWithBalance)

/**
 * Meld only ever trades native, ERC-20 and SPL tokens. This is an allowlist
 * rather than an ERC-721/ERC-1155 denylist so newly added token types (e.g.
 * `HYPERCORE_SPOT`) can't silently leak into the buy/withdraw lists.
 */
const MELD_LISTABLE_TOKEN_TYPES: TokenType[] = [
  TokenType.NATIVE,
  TokenType.ERC20,
  TokenType.SPL
]

export type MeldListFilterOptions = {
  includeZeroBalance: boolean
  tokenVisibility: TokenVisibility
  enabledChainIds: number[]
}

export const passesMeldListFilters = (
  token: LocalTokenWithBalance,
  {
    includeZeroBalance,
    tokenVisibility,
    enabledChainIds
  }: MeldListFilterOptions
): boolean =>
  (includeZeroBalance || token.balance > 0n) &&
  isTokenVisible(tokenVisibility, token) &&
  MELD_LISTABLE_TOKEN_TYPES.includes(token.type) &&
  enabledChainIds.includes(token.networkChainId)

export const meldContractTokenKey = (
  chainId: number | string,
  address: string
): string => `${chainId}-${address.toLowerCase()}`

/**
 * Meld reports Solana under its own `SOLANA_MELD_CHAIN_ID`, so it has to be
 * translated to the numeric chain id the contract-token catalog is keyed by.
 */
export const meldCurrencyTokenKey = (
  crypto: CryptoCurrency
): string | undefined => {
  if (!crypto.contractAddress || !crypto.chainId) return undefined
  const chainId =
    crypto.chainId === SOLANA_MELD_CHAIN_ID.toString()
      ? ChainId.SOLANA_MAINNET_ID
      : crypto.chainId
  return meldContractTokenKey(chainId, crypto.contractAddress)
}

export const isSupportedNativeErc20Token = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  token.networkChainId.toString() === crypto.chainId &&
  token.type === TokenType.NATIVE &&
  crypto.contractAddress?.toLocaleLowerCase() ===
    NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS.toLowerCase()

export const isSupportedToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  'chainId' in token &&
  token.chainId?.toString() === crypto.chainId &&
  crypto.contractAddress?.toLowerCase() === token.address.toLowerCase()

export const isSupportedSPLToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  token.networkChainId === ChainId.SOLANA_MAINNET_ID &&
  token.type === TokenType.SPL &&
  crypto.contractAddress?.toLowerCase() === token.address.toLowerCase()

export const isBtcToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean => crypto.currencyCode === 'BTC' && token.symbol === 'BTC'

export const isSolToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean => crypto.currencyCode === 'SOL' && token.symbol === 'SOL'

export const isTokenTradable = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  isSupportedNativeErc20Token(crypto, token) ||
  isSupportedToken(crypto, token) ||
  isBtcToken(crypto, token) ||
  isSolToken(crypto, token) ||
  isSupportedSPLToken(crypto, token)

export const dismissMeldStack = (
  _: typeof ACTIONS.OnrampCompleted | typeof ACTIONS.OfframpCompleted,
  searchParams: URLSearchParams
): void => {
  const dismissCount = searchParams.get('dismissCount') ?? ''

  // the number of dismisses is the number of meld screens to dismiss
  // there is currently at most 2 meld screens
  // TODO: when we start implementing native buy/sell, we can simply call dismissAll() and back()
  // the first dismiss is the selectBuyAmountScreen
  // the second dismiss is the selectBuyTokenScreen (only if user launched buy from token detail)
  Array.from({ length: Number(dismissCount) }).forEach(() => {
    router.canGoBack() && router.back()
  })
  router.navigate({
    pathname: '/transactionSuccessful',
    params: {
      title: 'Transaction submitted',
      description:
        'Please wait while we process your transaction. You can dismiss this screen at any time.',
      buttonText: 'Done'
    }
  })
}

export const getErrorMessage = (
  error?: Error | null
): CryptoQuotesError | undefined => {
  if (error && 'response' in error) {
    const response = error.response as {
      status?: number
      statusText?: string
      data?:
        | CreateCryptoQuoteError
        | CreateCryptoQuoteNotFoundError
        | { message: string }
    }
    if (response.data && 'status' in response.data) {
      return {
        statusCode: response.data.status,
        message: response.data.message
      }
    }
    if (response.data && 'code' in response.data) {
      return {
        statusCode: response.data.code,
        message: response.data.message
      }
    }
    // Some errors (e.g. NO_VALID_QUOTES) carry only a `message` with no
    // `status`/`code` field — surface that message rather than the bare
    // HTTP status line.
    if (response.data && 'message' in response.data && response.data.message) {
      return {
        statusCode:
          (response.status as CreateCryptoQuoteErrorCode) ??
          CreateCryptoQuoteErrorCode.BAD_REQUEST,
        message: response.data.message
      }
    }
    if (response.status !== undefined) {
      return {
        statusCode: response.status as CreateCryptoQuoteErrorCode,
        message: response.statusText
      }
    }
  }
  return undefined
}
