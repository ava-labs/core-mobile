import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import AccountService from 'services/account/AccountsService'
import BtcActivityService from './BtcActivityService'
import EvmActivityService from './EvmActivityService'
import {
  GetActivitiesForAccountParams,
  ActivityResponse,
  NetworkActivityService
} from './types'

const serviceMap: { [K in NetworkVMType]?: NetworkActivityService } = {
  [NetworkVMType.BITCOIN]: BtcActivityService,
  [NetworkVMType.EVM]: EvmActivityService
}

class ActivityServiceFactory {
  static getService(k: NetworkVMType) {
    return serviceMap[k]
  }
}

export class ActivityService {
  private getActivityServiceForNetwork(network: Network) {
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
    const activityService = this.getActivityServiceForNetwork(network)
    const address = AccountService.getAddressForNetwork(account, network)

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
