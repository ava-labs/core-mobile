import { TokenUnit } from '@avalabs/core-utils-sdk'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import {
  BalanceServiceProvider,
  GetBalancesParams
} from 'services/balance/types'
import NetworkService from 'services/network/NetworkService'
import {
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import TokenService from 'services/token/TokenService'
import {
  type NetworkTokenWithBalance,
  TokenType
} from '@avalabs/vm-module-types'

export class BtcBalanceService implements BalanceServiceProvider {
  async isProviderFor(network: Network): Promise<boolean> {
    return network.vmName === NetworkVMType.BITCOIN
  }

  async getBalances({
    network,
    accountAddress,
    currency,
    sentryTrx
  }: GetBalancesParams): Promise<NetworkTokenWithBalance[]> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.balance.btc.get')
      .executeAsync(async () => {
        const { networkToken } = network
        const provider = NetworkService.getProviderForNetwork(
          network
        ) as JsonRpcBatchInternal & BitcoinProvider

        const nativeTokenId =
          network.pricingProviders?.coingecko?.nativeTokenId ?? ''

        const {
          price: priceInCurrency,
          marketCap,
          vol24,
          change24
        } = await TokenService.getPriceWithMarketDataByCoinId(
          nativeTokenId,
          currency as VsCurrencyType
        )
        const { balance: balanceSatoshis, utxos } =
          await provider.getUtxoBalance(accountAddress, false)
        const balance = new TokenUnit(
          balanceSatoshis,
          networkToken.decimals,
          networkToken.symbol
        )
        const balanceDisplayValue = balance.toDisplay()
        const balanceCurrencyDisplayValue = priceInCurrency
          ? balance.mul(priceInCurrency).toDisplay(2)
          : ''
        const balanceInCurrency =
          balanceCurrencyDisplayValue === undefined
            ? undefined
            : Number(balanceCurrencyDisplayValue.replaceAll(',', ''))

        return [
          {
            ...networkToken,
            type: TokenType.NATIVE,
            coingeckoId: nativeTokenId,
            balance: balance.toSubUnit(),
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
