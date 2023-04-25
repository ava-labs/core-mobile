import { satoshiToBtc } from '@avalabs/bridge-sdk'
import { balanceToDisplayValue, bigToBN } from '@avalabs/utils-sdk'
import {
  NetworkTokenWithBalance,
  TokenType,
  TokenWithBalanceERC20
} from 'store/balance'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { getInstance } from 'services/token/TokenService'
import { BalanceServiceProvider } from 'services/balance/types'
import NetworkService from 'services/network/NetworkService'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { Transaction } from '@sentry/types'
import SentryWrapper from 'services/sentry/SentryWrapper'

export class BtcBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return network.vmName === NetworkVMType.BITCOIN
  }

  async getBalances(
    network: Network,
    userAddress: string,
    currency: string,
    sentryTrx?: Transaction
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.btc.get')
      .executeAsync(async () => {
        const tokenService = getInstance()
        const { networkToken } = network
        const provider = NetworkService.getProviderForNetwork(
          network
        ) as JsonRpcBatchInternal & BlockCypherProvider

        const nativeTokenId =
          network.pricingProviders?.coingecko?.nativeTokenId ?? ''

        const {
          price: priceInCurrency,
          marketCap,
          vol24,
          change24
        } = await tokenService.getPriceWithMarketDataByCoinId(
          nativeTokenId,
          currency as VsCurrencyType
        )
        const denomination = networkToken.decimals
        const { balance: balanceSatoshis, utxos } =
          await provider.getUtxoBalance(userAddress)
        const balanceBig = satoshiToBtc(balanceSatoshis)
        const balanceNum = balanceBig.toNumber()
        const balance = bigToBN(balanceBig, denomination)
        const balanceDisplayValue = balanceToDisplayValue(balance, denomination)
        const balanceCurrencyDisplayValue = priceInCurrency
          ? balanceBig.mul(priceInCurrency).toFixed(2)
          : ''
        const balanceInCurrency =
          priceInCurrency && balanceNum ? priceInCurrency * balanceNum : 0

        return [
          {
            ...networkToken,
            type: TokenType.NATIVE,
            coingeckoId: nativeTokenId,
            balance,
            balanceDisplayValue,
            balanceInCurrency,
            balanceCurrencyDisplayValue,
            priceInCurrency,
            utxos,
            marketCap,
            vol24,
            change24
          }
        ]
      })
  }
}

export default new BtcBalanceService()
