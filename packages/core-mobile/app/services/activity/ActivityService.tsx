import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import Logger from 'utils/Logger'
import BtcActivityService from './BtcActivityService'
import {
  GetActivitiesForAccountParams,
  ActivityResponse,
  NetworkActivityService
} from './types'
import { convertTransaction } from './utils/evmTransactionConverter'

const serviceMap: { [K in NetworkVMType]?: NetworkActivityService } = {
  [NetworkVMType.BITCOIN]: BtcActivityService
}

class ActivityServiceFactory {
  static getService(k: NetworkVMType): NetworkActivityService | undefined {
    return serviceMap[k]
  }
}

export class ActivityService {
  private getActivityServiceForNetwork(
    network: Network
  ): NetworkActivityService {
    const balanceService = ActivityServiceFactory.getService(network.vmName)

    if (!balanceService)
      throw new Error(
        `no activity service found for network ${network.chainId}`
      )

    return balanceService
  }

  async getActivities({
    network,
    account,
    nextPageToken,
    pageSize = 30,
    criticalConfig
  }: GetActivitiesForAccountParams): Promise<ActivityResponse> {
    const address = getAddressByNetwork(account, network)
    // todo: remove if statement once all modules are implmeneted
    if (
      network.vmName === NetworkVMType.EVM ||
      network.vmName === NetworkVMType.AVM ||
      network.vmName === NetworkVMType.PVM
    ) {
      try {
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
      } catch (error) {
        Logger.error('Failed to get transaction', error)
      }
    }
    const activityService = this.getActivityServiceForNetwork(network)
    return activityService.getActivities({
      network,
      address,
      nextPageToken,
      pageSize,
      criticalConfig
    })
  }
}

export default new ActivityService()
