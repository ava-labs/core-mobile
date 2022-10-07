import { NetworkTokenWithBalance, TokenWithBalanceERC20 } from 'store/balance'
import { Network } from '@avalabs/chains-sdk'
import { Account } from 'store/account'
import AccountsService from 'services/account/AccountsService'
import GlacierBalanceProvider from 'services/balance/GlacierBalanceService'
import { BalanceServiceProvider } from 'services/balance/types'
import { findAsyncSequential } from 'utils/Utils'
import BtcBalanceService from './BtcBalanceService'
import EvmBalanceService from './EvmBalanceService'

const balanceProviders: BalanceServiceProvider[] = [
  GlacierBalanceProvider,
  BtcBalanceService,
  EvmBalanceService
]

export class BalanceService {
  async getBalancesForAccount(
    network: Network,
    account: Account,
    currency: string
  ): Promise<{
    accountIndex: number
    chainId: number
    accountAddress: string
    tokens: (NetworkTokenWithBalance | TokenWithBalanceERC20)[]
  }> {
    const accountAddress = AccountsService.getAddressForNetwork(
      account,
      network
    )
    const balanceProvider = await findAsyncSequential(balanceProviders, value =>
      value.isProviderFor(network)
    )
    if (!balanceProvider) {
      throw new Error(
        `no balance provider found for network ${network.chainId}`
      )
    }
    const tokens = await balanceProvider.getBalances(
      network,
      accountAddress,
      currency
    )
    return {
      accountIndex: account.index,
      chainId: network.chainId,
      tokens,
      accountAddress
    }
  }

  async getBalancesForAddress(
    network: Network,
    address: string,
    currency: string
  ): Promise<(NetworkTokenWithBalance | TokenWithBalanceERC20)[]> {
    const balanceProvider = await findAsyncSequential(balanceProviders, value =>
      value.isProviderFor(network)
    )
    if (!balanceProvider) {
      throw new Error(
        `no balance provider found for network ${network.chainId}`
      )
    }

    return balanceProvider.getBalances(network, address, currency)
  }
}

export default new BalanceService()
