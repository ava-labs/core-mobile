import { LocalTokenWithBalance } from 'store/balance'
import { isTokenVisible } from 'store/balance/utils'
import { TokenVisibility } from 'store/portfolio'
import { NetworkContractToken, TokenType } from '@avalabs/vm-module-types'
import { ChainId } from '@avalabs/core-chains-sdk'
import { TokenUnit } from '@avalabs/core-utils-sdk'
import { router } from 'expo-router'
import { getLocalTokenId } from 'services/balance/utils/getLocalTokenId'
import { humanize } from 'utils/string/humanize'
import { ACTIONS } from '../../../contexts/DeeplinkContext/types'
import {
  NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS,
  PaymentMethodNames,
  ServiceProviderCategories,
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
 * Only transient failures are worth react-query's retry behavior. A network
 * failure (offline, timeout) throws without a `response`, so getErrorMessage
 * resolves no statusCode at all — that's the class most likely to be transient
 * and previously got react-query's default retries. A numeric 5xx is an
 * upstream outage. Everything else is deterministic for the given request
 * params and won't succeed by retrying unchanged: a numeric 4xx, and Meld's
 * string error codes (e.g. INCOMPATIBLE_REQUEST, which getErrorMessage surfaces
 * via `response.data.code`) — so a non-numeric statusCode is NOT retryable.
 */
export const shouldRetryCryptoQuote = (
  failureCount: number,
  error: Error
): boolean => {
  const statusCode = getErrorMessage(error)?.statusCode
  const isTransient =
    statusCode === undefined ||
    (typeof statusCode === 'number' && statusCode >= 500)
  return isTransient && failureCount < 3
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
  attemptedPaymentMethods,
  selectedCurrency
}: {
  isNoValidQuotesError: boolean
  paymentMethod: string | undefined
  paymentMethodIsManual: boolean
  isLoadingFallbackQuotes: boolean
  fallbackQuotes: Quote[]
  attemptedPaymentMethods: string[]
  selectedCurrency: string
}): NoValidQuotesFallbackResult => {
  if (!hasNoValidQuotesError || paymentMethod === undefined) {
    return { action: 'none' }
  }

  // still resolving — avoid flashing an error while the fallback is in flight
  if (isLoadingFallbackQuotes) {
    return { action: 'none' }
  }

  const noRegionalSupport: NoValidQuotesFallbackResult = {
    action: 'error',
    message: `No payment methods currently support ${selectedCurrency} purchases in your region. Try changing your currency in settings.`
  }

  // paymentMethodType is nullable per the schema, so a leading quote can lack
  // one while a later quote is still quotable — check the whole batch, not
  // just the first, before declaring no regional support.
  if (!fallbackQuotes.some(quote => quote.paymentMethodType)) {
    return noRegionalSupport
  }

  // A method Meld returns in the unfiltered fallback batch can itself 400 once
  // we re-quote with it as an explicit filter (the same over-rejection quirk).
  // Adopting reactively off the fallback result would then re-adopt another
  // method, which can fail too and ping-pong back — an infinite render loop.
  // Only consider methods we haven't already tried this round, so adoption
  // strictly makes progress and terminates in the error branch once every
  // quotable method has been exhausted.
  const adoptable = fallbackQuotes.find(
    quote =>
      quote.paymentMethodType &&
      quote.paymentMethodType !== paymentMethod &&
      !attemptedPaymentMethods.includes(quote.paymentMethodType)
  )

  if (!paymentMethodIsManual) {
    if (!adoptable?.paymentMethodType) {
      return noRegionalSupport
    }

    return {
      action: 'adopt',
      paymentMethodType: adoptable.paymentMethodType,
      serviceProvider: adoptable.serviceProvider ?? undefined
    }
  }

  const currentName = humanizePaymentMethodName(paymentMethod)
  // Suggest a genuinely different method, not the one the user already picked
  // (the unfiltered batch can list the failing method first).
  const suggestionName = humanizePaymentMethodName(adoptable?.paymentMethodType)

  return {
    action: 'error',
    message: `${
      currentName ?? 'This payment method'
    } isn't available for this purchase. Try ${
      suggestionName ?? 'a different payment method'
    }.`
  }
}

/**
 * Meld returns a batch of quotes across every quotable service provider, not
 * just the one currently selected. Prefer the quote for the selected
 * provider so the fee shown matches what checkout will actually charge;
 * fall back to the best (lowest-fee) quote — quotes[0], which the caller
 * passes already sorted ascending by fee — when the selected provider
 * didn't quote.
 */
export const selectQuoteForDisplay = (
  quotes: Quote[],
  serviceProvider: string | undefined
): Quote | undefined => {
  if (quotes.length === 0) return undefined
  const matching =
    serviceProvider &&
    quotes.find(quote => quote.serviceProvider === serviceProvider)
  return matching || quotes[0]
}

/**
 * Onramp only: resolves the post-fee token amount Meld's quote actually
 * pays out, so the amount line above the fiat input can show a real
 * (fee-inclusive) estimate instead of a feeless spot-price conversion.
 *
 * Returns `undefined` whenever the caller should keep showing the
 * spot-price estimate instead — quotes are loading/absent/errored, or the
 * last-fetched quote batch is for a different amount than what's currently
 * displayed. That mismatch happens while the user is still typing: the
 * subtext renders the raw, un-debounced input on every keystroke, but
 * `sourceAmount` (and the quotes fetched for it) only catches up after the
 * debounce settles.
 */
export const resolveQuoteDestinationAmount = ({
  category,
  displayedAmount,
  sourceAmount,
  isLoadingCryptoQuotes,
  crytoQuotes,
  serviceProvider
}: {
  category: ServiceProviderCategories
  displayedAmount: number | undefined | null
  sourceAmount: number | undefined
  isLoadingCryptoQuotes: boolean
  crytoQuotes: Quote[]
  serviceProvider: string | undefined
}): number | undefined => {
  if (category !== ServiceProviderCategories.CRYPTO_ONRAMP) return undefined
  if (isLoadingCryptoQuotes) return undefined
  if (
    displayedAmount === undefined ||
    displayedAmount === null ||
    sourceAmount === undefined ||
    displayedAmount !== sourceAmount
  ) {
    return undefined
  }

  const quote = selectQuoteForDisplay(crytoQuotes, serviceProvider)
  return quote?.destinationAmount ?? undefined
}

/**
 * Token amount to show for a quote line item in the provider-picker list.
 * destinationAmount (onramp: crypto received) / sourceAmount (offramp:
 * crypto sold) is already Meld's fee-inclusive figure — totalFee is a
 * source-currency disclosure of the spread already priced into
 * exchangeRate, not a separate deduction on top of it. Subtracting
 * totalFee/exchangeRate here would double-count the fee and understate the
 * amount.
 */
export const resolveQuoteTokenAmount = (
  quote: Quote,
  category: ServiceProviderCategories
): number =>
  category === ServiceProviderCategories.CRYPTO_ONRAMP
    ? quote.destinationAmount ?? 0
    : quote.sourceAmount ?? 0

/**
 * Builds a TokenUnit from an amount already expressed in display units
 * (e.g. Meld's quote destinationAmount, or a spot-price conversion), scaled
 * up to the base units TokenUnit's constructor expects. Shared by the spot
 * and quote-based amount paths in useSelectAmount so both round-trip
 * through the exact same base-unit conversion and pick up TokenUnit's
 * magnitude-based rounding identically when rendered via `toDisplay`.
 */
export const buildDisplayTokenUnit = (
  displayAmount: number,
  maxDecimals: number,
  symbol: string
): TokenUnit =>
  new TokenUnit(displayAmount * 10 ** maxDecimals, maxDecimals, symbol)
