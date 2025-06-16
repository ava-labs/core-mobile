import { LocalTokenWithBalance } from 'store/balance'
import { TokenType } from '@avalabs/vm-module-types'
import { CryptoCurrency } from './types'
import { NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS } from './consts'
import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { transactionSnackbar } from 'common/utils/toast'
import { Router } from 'expo-router'

export const isSupportedNativeToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  token.networkChainId.toString() === crypto.chainId &&
  token.type === TokenType.NATIVE &&
  crypto.contractAddress === NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS

export const isSupportedToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  'chainId' in token &&
  token.chainId?.toString() === crypto.chainId &&
  crypto.contractAddress === token.address

export const isBtcToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean => crypto.currencyCode === 'BTC' && token.symbol === 'BTC'

export const isTokenSupportedForBuying = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  isSupportedNativeToken(crypto, token) ||
  isSupportedToken(crypto, token) ||
  isBtcToken(crypto, token)

export const getBuyableCryptoCurrency = ({
  cryptoCurrencies,
  tokenOrAddress
}: {
  cryptoCurrencies?: CryptoCurrency[]
  tokenOrAddress?: LocalTokenWithBalance | string
}): CryptoCurrency | undefined => {
  if (!tokenOrAddress || !cryptoCurrencies) {
    return undefined
  }

  if (typeof tokenOrAddress === 'string') {
    return cryptoCurrencies.find(
      crypto => crypto.contractAddress === tokenOrAddress
    )
  }

  return cryptoCurrencies.find(crypto =>
    isTokenSupportedForBuying(crypto, tokenOrAddress)
  )
}

export const dismissMeldStack = (
  router: Router,
  message: string,
  searchParams: URLSearchParams
): void => {
  const dismissCount = searchParams.get('dismissCount') ?? ''
  closeInAppBrowser()
  transactionSnackbar.success({
    message
  })
  // the number of dismisses is the number of meld screens to dismiss
  // there is currently at most 2 meld screens
  // the first dismiss is the selectBuyAmountScreen
  // the second dismiss is the selectBuyTokenScreen (only if user launched buy from token detail)
  Array.from({ length: Number(dismissCount) }).forEach(() => {
    router.canGoBack() && router.back()
  })
  confetti.restart()
}
