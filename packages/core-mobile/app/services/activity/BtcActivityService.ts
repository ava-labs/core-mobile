import { BitcoinProvider } from '@avalabs/wallets-sdk'
import NetworkService from 'services/network/NetworkService'
import { Transaction } from 'store/transaction'
import { GetActivitiesForAddressParams, NetworkActivityService } from './types'
import { convertTransaction } from './utils/btcTransactionConverter'

export class BtcActivityService implements NetworkActivityService {
  async getActivities({
    network,
    address,
    criticalConfig
  }: GetActivitiesForAddressParams): Promise<{
    transactions: Transaction[]
  }> {
    const provider = NetworkService.getProviderForNetwork(
      network
    ) as BitcoinProvider
    const response = await provider.getTxHistory(address) // returns the 25 most reacent transactions

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
