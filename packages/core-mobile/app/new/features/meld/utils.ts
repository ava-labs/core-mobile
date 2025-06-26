import { LocalTokenWithBalance } from 'store/balance'
import { TokenType } from '@avalabs/vm-module-types'
import { closeInAppBrowser } from 'utils/openInAppBrowser'
import { router } from 'expo-router'
import { ACTIONS } from '../../../contexts/DeeplinkContext/types'
import { NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS } from './consts'
import { CryptoCurrency } from './types'

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
  crypto.contractAddress?.toLowerCase() === token.address.toLowerCase()

export const isBtcToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean => crypto.currencyCode === 'BTC' && token.symbol === 'BTC'

export const isTokenTradable = (
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
      crypto =>
        crypto.contractAddress?.toLowerCase() === tokenOrAddress.toLowerCase()
    )
  }

  return cryptoCurrencies.find(crypto =>
    isTokenTradable(crypto, tokenOrAddress)
  )
}

export const dismissMeldStack = (
  _: typeof ACTIONS.OnrampCompleted | typeof ACTIONS.OfframpCompleted,
  searchParams: URLSearchParams
): void => {
  const dismissCount = searchParams.get('dismissCount') ?? ''
  closeInAppBrowser()
  // the number of dismisses is the number of meld screens to dismiss
  // there is currently at most 2 meld screens
  // TODO: when we start implementing native buy/sell, we can simply call dismissAll() and back()
  // the first dismiss is the selectBuyAmountScreen
  // the second dismiss is the selectBuyTokenScreen (only if user launched buy from token detail)
  Array.from({ length: Number(dismissCount) }).forEach(() => {
    router.canGoBack() && router.back()
  })
  router.navigate({
    // @ts-ignore TODO: make routes typesafe
    pathname: '/transactionSuccessful',
    params: {
      title: 'Transaction submitted',
      description:
        'Please wait while we process your transaction. You can dismiss this screen at any time.',
      buttonText: 'Done'
    }
  })
}
