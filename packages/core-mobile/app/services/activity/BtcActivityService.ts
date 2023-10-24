import { BlockCypherProvider } from '@avalabs/wallets-sdk'
import NetworkService from 'services/network/NetworkService'
import { GetActivitiesForAddressParams, NetworkActivityService } from './types'
import { convertTransaction } from './utils/btcTransactionConverter'

export class BtcActivityService implements NetworkActivityService {
  async getActivities({
    network,
    address,
    criticalConfig
  }: GetActivitiesForAddressParams) {
    const provider = NetworkService.getProviderForNetwork(
      network
    ) as BlockCypherProvider
    const response = await provider.getTxHistory(address, { limit: 50 }) // TODO support pagination

    const bitcoinWalletAddresses =
      criticalConfig?.criticalBitcoin?.walletAddresses

    const transactions = response.map(item =>
      convertTransaction({ item, network, address, bitcoinWalletAddresses })
    )
    return {
      transactions
    }
  }
}

export default new BtcActivityService()
