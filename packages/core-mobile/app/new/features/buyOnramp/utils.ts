import { LocalTokenWithBalance } from 'store/balance'
import { NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS } from 'services/meld/consts'
import { TokenType } from '@avalabs/vm-module-types'
import { CryptoCurrency } from './hooks/useSearchCryptoCurrencies'

export const isSupportedNativeToken = (
  crypto: CryptoCurrency,
  token: LocalTokenWithBalance
): boolean =>
  token.networkChainId.toString() === crypto.chainId &&
  token.type === TokenType.NATIVE &&
  crypto.contractAddress === NATIVE_ERC20_TOKEN_CONTRACT_ADDRESS

export const isSupportedErc20Token = (
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

  return cryptoCurrencies.find(crypto => {
    return (
      isSupportedNativeToken(crypto, tokenOrAddress) ||
      isSupportedErc20Token(crypto, tokenOrAddress) ||
      isBtcToken(crypto, tokenOrAddress)
    )
  })
}
