import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { ActivityResponse, GetActivitiesForAccountParams } from './types'
import { convertTransaction } from './utils/convertTransaction'

export class ActivityService {
  async getActivities({
    network,
    account,
    nextPageToken,
    pageSize = 30,
    criticalConfig
  }: GetActivitiesForAccountParams): Promise<ActivityResponse> {
    const address = getAddressByNetwork(account, network)
    const module = await ModuleManager.loadModuleByNetwork(network)
    const rawTxHistory = await module.getTransactionHistory({
      network: mapToVmNetwork(network),
      address,
      nextPageToken,
      offset: pageSize
    })

    const transactions = rawTxHistory.transactions.map(tx =>
      convertTransaction(tx, network, criticalConfig)
    )

    return {
      transactions,
      nextPageToken: rawTxHistory.nextPageToken
    }
  }
}

export default new ActivityService()
