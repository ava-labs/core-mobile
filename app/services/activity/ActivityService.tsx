import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { ListTransactionDetailsDto } from '@avalabs/glacier-sdk'
import BtcActivityService from './BtcActivityService'
import EvmActivityService from './EvmActivityService'
import { GetActivitiesParams } from './types'

const serviceMap = {
  [NetworkVMType.BITCOIN]: BtcActivityService,
  [NetworkVMType.EVM]: EvmActivityService
}

type ServiceMap = typeof serviceMap
type Keys = keyof ServiceMap

class ActivityServiceFactory {
  static getService(k: Keys) {
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
    address,
    nextPageToken,
    pageSize = 30
  }: GetActivitiesParams): Promise<ListTransactionDetailsDto> {
    const activityService = this.getActivityServiceForNetwork(network)
    return activityService.getActivities({
      network,
      address,
      nextPageToken,
      pageSize
    })
  }
}

export default new ActivityService()
