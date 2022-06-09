import { BlockCypherProvider } from '@avalabs/wallets-sdk'
import { satoshiToBtc } from '@avalabs/bridge-sdk'
import { balanceToDisplayValue, bigToBN } from '@avalabs/utils-sdk'
import { TokenType, TokenWithBalance } from 'store/balance'
import { Network } from '@avalabs/chains-sdk'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import TokenService from './TokenService'

export class BtcBalanceService {
  async getBalances(
    network: Network,
    provider: BlockCypherProvider,
    userAddress: string,
    currency: string
  ): Promise<TokenWithBalance[]> {
    const { networkToken, chainId } = network

    const nativeTokenId =
      network.pricingProviders?.coingecko?.nativeTokenId ?? ''

    const id = `${chainId}-${nativeTokenId}`
    const {
      price: priceUSD,
      marketCap,
      vol24,
      change24
    } = await TokenService.getPriceWithMarketDataByCoinId(
      nativeTokenId,
      currency as VsCurrencyType
    )
    const denomination = networkToken.decimals
    const { balance: balanceSatoshis, utxos } = await provider.getUtxoBalance(
      userAddress
    )
    const balanceBig = satoshiToBtc(balanceSatoshis)
    const balanceNum = balanceBig.toNumber()
    const balance = bigToBN(balanceBig, denomination)
    const balanceDisplayValue = balanceToDisplayValue(balance, denomination)
    const balanceUsdDisplayValue = priceUSD
      ? balanceBig.mul(priceUSD).toFixed(2)
      : ''
    const balanceUSD = priceUSD && balanceNum ? priceUSD * balanceNum : 0

    return [
      {
        ...networkToken,
        type: TokenType.NATIVE,
        id,
        coingeckoId: nativeTokenId,
        balance,
        balanceDisplayValue,
        balanceUSD,
        balanceUsdDisplayValue,
        priceUSD,
        utxos,
        marketCap,
        vol24,
        change24
      }
    ]
  }
}

export default new BtcBalanceService()
