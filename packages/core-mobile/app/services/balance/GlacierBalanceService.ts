import { ChainId } from '@avalabs/chains-sdk'
import { CurrencyCode, NativeTokenBalance } from '@avalabs/glacier-sdk'
import { isBitcoinChainId } from 'utils/network/isBitcoinNetwork'
import { isXPChain } from 'utils/network/isAvalancheNetwork'
import GlacierService from 'services/GlacierService'

export class GlacierBalanceService {
  private getNativeBalance(
    chainId: string,
    address: string,
    currency: string
  ): Promise<NativeTokenBalance> {
    if (
      isBitcoinChainId(Number.parseInt(chainId)) ||
      isXPChain(Number.parseInt(chainId))
    ) {
      return Promise.reject(
        'Chain id not compatible, skipping getNativeBalance'
      )
    }
    return GlacierService.getNativeBalance({
      chainId,
      address,
      currency: currency.toLocaleLowerCase() as CurrencyCode
    }).then(res => res.nativeTokenBalance)
  }

  async getCChainBalance(
    isDeveloperMode: boolean,
    address: string,
    selectedCurrency: string
  ): Promise<NativeTokenBalance> {
    const chainId = isDeveloperMode
      ? ChainId.AVALANCHE_TESTNET_ID
      : ChainId.AVALANCHE_MAINNET_ID

    return this.getNativeBalance(chainId.toString(), address, selectedCurrency)
  }
}

export default new GlacierBalanceService()
