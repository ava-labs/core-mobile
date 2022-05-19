import { BlockCypherProvider } from '@avalabs/wallets-sdk'
import { satoshiToBtc } from '@avalabs/bridge-sdk'
import { balanceToDisplayValue, bigToBN } from '@avalabs/utils-sdk'
import { TokenWithBalance } from 'store/balance'
import { currentSelectedCurrency$ } from '@avalabs/wallet-react-components'
import { firstValueFrom } from 'rxjs'
import { Network } from '@avalabs/chains-sdk'
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
      network.networkToken.coingeckoId,
      selectedCurrency
    )

    const denomination = network.networkToken.decimals
    const { balance: balanceSatoshis } = await provider.getUtxoBalance(
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
        ...network.networkToken,
        balance,
        balanceDisplayValue,
        balanceUsdDisplayValue,
        priceUSD: tokenPrice
      }
    ]
  }
}

export default new BtcBalanceService()
