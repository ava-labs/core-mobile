import { LocalTokenWithBalance } from 'store/balance'
import { TokenType } from '@avalabs/vm-module-types'
import { CryptoCurrency } from './types'
import { NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS } from './consts'

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
