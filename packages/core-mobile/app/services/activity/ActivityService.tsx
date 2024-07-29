import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { TransactionHistoryResponse } from '@avalabs/vm-module-types'
import { GetActivitiesForAccountParams } from './types'
import { convertTransaction } from './utils/evmTransactionConverter'

export class ActivityService {
  async getActivities({
    network,
    account,
    nextPageToken,
    pageSize = 30
  }: GetActivitiesForAccountParams): Promise<TransactionHistoryResponse> {
    const address = getAddressByNetwork(account, network)
    const module = await ModuleManager.loadModuleByNetwork(network)
    const rawTxHistory = await module.getTransactionHistory({
      network: mapToVmNetwork(network),
      address,
      nextPageToken,
      offset: pageSize
    })

    const transactions = rawTxHistory.transactions.map(tx =>
      convertTransaction(tx)
    )

    return {
      transactions,
      nextPageToken: rawTxHistory.nextPageToken
    }
  }
}

export default new ActivityService()
