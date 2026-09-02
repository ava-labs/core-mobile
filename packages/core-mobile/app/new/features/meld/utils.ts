import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { TokenVisibility } from 'store/portfolio'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { router } from 'expo-router'
import { getLocalTokenId } from 'services/balance/utils/getLocalTokenId'
import { humanize } from 'utils/string/humanize'
import { ACTIONS } from '../../../contexts/DeeplinkContext/types'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  PaymentMethodNames,
  SOLANA_MELD_CHAIN_ID
} from './consts'
import {
  CreateCryptoQuoteNotFoundError,
  CreateCryptoQuoteError,
  CryptoCurrency,
  CryptoQuotesError,
  CreateCryptoQuoteErrorCode,
  Quote
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

/**
 * Only 5xx (Meld/upstream outage) is worth react-query's default retry
 * behavior. 4xx errors like NO_VALID_QUOTES are deterministic for the given
 * request params and won't succeed by retrying unchanged. A network failure
 * (offline, timeout) throws without a `response`, so getErrorMessage can't
 * resolve a statusCode at all — treat that as retryable too, since it's the
 * class of error most likely to be transient and previously got react-query's
 * default retries.
 */
export const shouldRetryCryptoQuote = (
  failureCount: number,
  error: Error
): boolean => {
  const statusCode = getErrorMessage(error)?.statusCode
  return (
    (typeof statusCode !== 'number' || statusCode >= 500) && failureCount < 3
  )
}

/**
 * NO_VALID_QUOTES has no dedicated status/code field — Meld returns it as a
 * plain 400 with only a `message`, which lands in getErrorMessage's
 * message-only branch above. Detection is by message content.
 */
export const isNoValidQuotesError = (error?: CryptoQuotesError): boolean =>
  error?.statusCode === CreateCryptoQuoteErrorCode.BAD_REQUEST &&
  (error.message?.toLowerCase().includes('no valid quote') ?? false)

export const humanizePaymentMethodName = (
  paymentMethodType?: string | null
): string | undefined => {
  if (!paymentMethodType) return undefined
  return PaymentMethodNames[paymentMethodType] ?? humanize(paymentMethodType)
}

export type NoValidQuotesFallbackResult =
  | { action: 'none' }
  | { action: 'adopt'; paymentMethodType: string; serviceProvider?: string }
  | { action: 'error'; message: string }

/**
 * Decides what to do once the onramp quote request 400s with NO_VALID_QUOTES
 * for the currently selected payment method. Meld's crypto-quote endpoint
 * over-rejects specific paymentMethodType filters that the same request with
 * paymentMethodType omitted can still quote (verified against the live API).
 * Callers fire that unfiltered fallback request and pass its result here.
 */
export const resolveNoValidQuotesFallback = ({
  isNoValidQuotesError: hasNoValidQuotesError,
  paymentMethod,
  paymentMethodIsManual,
  isLoadingFallbackQuotes,
  fallbackQuotes,
  selectedCurrency
}: {
  isNoValidQuotesError: boolean
  paymentMethod: string | undefined
  paymentMethodIsManual: boolean
  isLoadingFallbackQuotes: boolean
  fallbackQuotes: Quote[]
  selectedCurrency: string
}): NoValidQuotesFallbackResult => {
  if (!hasNoValidQuotesError || paymentMethod === undefined) {
    return { action: 'none' }
  }

  // still resolving — avoid flashing an error while the fallback is in flight
  if (isLoadingFallbackQuotes) {
    return { action: 'none' }
  }

  const bestFallback = fallbackQuotes[0]

  if (!bestFallback?.paymentMethodType) {
    return {
      action: 'error',
      message: `No payment methods currently support ${selectedCurrency} purchases in your region. Try changing your currency in settings.`
    }
  }

  if (!paymentMethodIsManual) {
    // The failing paymentMethod can still show up in the unfiltered fallback
    // results (a different, working provider offering the same method type).
    // Re-adopting that same value is a zustand no-op — the primary query key
    // never changes, so it would stall on the errored quote with no error
    // message. Skip ahead to the first quote that's actually different.
    const adoptable = fallbackQuotes.find(
      quote =>
        quote.paymentMethodType && quote.paymentMethodType !== paymentMethod
    )

    if (!adoptable?.paymentMethodType) {
      return {
        action: 'error',
        message: `No payment methods currently support ${selectedCurrency} purchases in your region. Try changing your currency in settings.`
      }
    }

    return {
      action: 'adopt',
      paymentMethodType: adoptable.paymentMethodType,
      serviceProvider: adoptable.serviceProvider ?? undefined
    }
  }

  const currentName = humanizePaymentMethodName(paymentMethod)
  const fallbackName = humanizePaymentMethodName(bestFallback.paymentMethodType)

  return {
    action: 'error',
    message: `${
      currentName ?? 'This payment method'
    } isn't available for this purchase. Try ${
      fallbackName ?? 'a different payment method'
    }.`
  }
}
