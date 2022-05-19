import {
  simplePrice,
  getBasicCoingeckoHttp,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { getTokensPrice } from '@avalabs/token-prices-sdk'
import { MAINNET_NETWORK } from 'store/network'

export class TokenService {
  /**
   * Call this to get the native token price
   * @param coinId the coin id ie avalanche-2 for avax
   * @param selectedCurrency the currency selected
   * @returns the native token price
   */
  async getPriceByCoinId(
    coinId: string,
    selectedCurrency: string
  ): Promise<number | undefined> {
    const currencyCode = selectedCurrency.toLowerCase() as VsCurrencyType

    const coinPriceResult = await simplePrice(getBasicCoingeckoHttp(), {
      coinIds: [coinId],
      currencies: [currencyCode]
    })

    return coinPriceResult[coinId]?.[currencyCode]?.price
  }

  /**
   *
   * @param tokens the tokens with addresses
   * @param assetPlatformId The platform id for the native token
   * @param coinId the coin id of the native token
   * @returns a dictionary of address and price
   */
  async getTokenPricesByAddresses(
    tokens: { address: string }[],
    assetPlatformId: string,
    coinId = MAINNET_NETWORK.nativeToken.coinId,
    selectedCurrency: string
  ): Promise<Record<string, number>> {
    const avaxPrice = await this.getPriceByCoinId(coinId, selectedCurrency)
    const tokenAddys = tokens.map(token => token.address)
    const currency = selectedCurrency.toLocaleLowerCase()
    const tokenPriceRes = await getTokensPrice(
      tokenAddys,
      currency,
      avaxPrice || 0,
      assetPlatformId
    )
    console.log('tokenPriceRes', tokenPriceRes)

    return tokenPriceRes
  }
}

export default new TokenService()
