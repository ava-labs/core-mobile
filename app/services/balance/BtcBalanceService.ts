import { BlockCypherProvider } from '@avalabs/wallets-sdk'
import { satoshiToBtc } from '@avalabs/bridge-sdk'
import { balanceToDisplayValue, bigToBN } from '@avalabs/utils-sdk'
import { Network } from 'store/network'
import { TokenWithBalance } from 'store/balance'
import { currentSelectedCurrency$ } from '@avalabs/wallet-react-components'
import { firstValueFrom } from 'rxjs'
import TokenService from './TokenService'

export class BtcBalanceService {
  async getBalances(
    network: Network,
    provider: BlockCypherProvider,
    userAddress: string
  ): Promise<TokenWithBalance[]> {
    // TODO store selected currency in redux
    const selectedCurrency = await firstValueFrom(currentSelectedCurrency$)

    const tokenPrice = await TokenService.getPriceByCoinId(
      network.nativeToken.coinId,
      selectedCurrency
    )

    const denomination = network.nativeToken.denomination
    const { balance: balanceSatoshis, utxos } = await provider.getUtxoBalance(
      userAddress
    )
    const balanceBig = satoshiToBtc(balanceSatoshis)
    const balance = bigToBN(balanceBig, denomination)
    const balanceDisplayValue = balanceToDisplayValue(balance, denomination)
    const balanceUsdDisplayValue = tokenPrice
      ? balanceBig.mul(tokenPrice).toFixed(2)
      : undefined

    return [
      {
        ...network.nativeToken,
        balance,
        balanceDisplayValue,
        balanceUsdDisplayValue,
        priceUSD: tokenPrice,
        utxos
      }
    ]
  }
}

export default new BtcBalanceService()
